import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { UserOrganizationRole } from '../entities/user-organization-role.entity';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserOrganizationRole) private roleRepo: Repository<UserOrganizationRole>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    private logsService: LogsService
  ) {}

  private isGlobalAdmin(email: string) {
    const seed = process.env.SEED_ADMIN_EMAIL || 'admin@system.com';
    return email === seed;
  }
  
  async createUser(actorEmail: string, dto: { email: string; password: string; name: string, orgId?: string; role?: string }) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ email: dto.email, password: hashedPassword, name: dto.name });
    const savedUser = await this.userRepo.save(user);

    if (dto.orgId && dto.role) {
      const actorIsGlobal = this.isGlobalAdmin(actorEmail);
      if (!actorIsGlobal) {
        const actorUser = await this.userRepo.findOne({ where: { email: actorEmail }, relations: ['orgRoles'] });
        const hasAdminRole = actorUser?.orgRoles.some(r => r.organization.id === dto.orgId && r.role === 'admin');
        if (!hasAdminRole) {
          throw new ForbiddenException('Only global admins or organization admins can assign roles');
        }
      }

      const org = await this.orgRepo.findOne({ where: { id: dto.orgId } });
      if (!org) throw new NotFoundException('Organization not found');

      const userRole = this.roleRepo.create({ user: savedUser, organization: org, role: dto.role as any });
      await this.roleRepo.save(userRole);
      await this.logsService.record(actorEmail, 'create_user_with_role', `user:${savedUser.id} org:${dto.orgId} role:${dto.role}`);
    } else {
      await this.logsService.record(actorEmail, 'create_user', `user:${savedUser.id}`);
    }

    return savedUser;
  }

  async updatePassword(actorEmail: string, userId: string, newPassword: string) {
    const actorIsGlobal = this.isGlobalAdmin(actorEmail);
    if (!actorIsGlobal && actorEmail !== (await this.userRepo.findOne({ where: { id: userId } }))?.email) {
      throw new ForbiddenException('Only global admins can change other users\' passwords');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    await this.logsService.record(actorEmail, 'update_user_password', `user:${userId}`);

    return { message: 'Password updated successfully' };
  }

  async listUsersInOrganization(actorEmail: string, orgId: string) {
    const actorIsGlobal = this.isGlobalAdmin(actorEmail);
    if (!actorIsGlobal) {
      const actorUser = await this.userRepo.findOne({ where: { email: actorEmail }, relations: ['orgRoles'] });
      const hasAccess = actorUser?.orgRoles.some(r => r.organization.id === orgId);
      if (!hasAccess) {
        throw new ForbiddenException('Not a member of this organization');
      }
    }

    const roles = await this.roleRepo.find({ where: { organization: { id: orgId } }, relations: ['user'] });
    return roles.map(r => ({ userId: r.user.id, email: r.user.email, name: r.user.name, role: r.role }));
  }

  async getUserById(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserRoles(userId: string) {
    const roles = await this.roleRepo.find({ where: { user: { id: userId } }, relations: ['organization'] });
    return roles.map(r => ({ organizationId: r.organization.id, organizationName: r.organization.name, role: r.role }));
  }

  async deleteUser(actorEmail: string, targetUserId: string) {
    const actorIsGlobal = this.isGlobalAdmin(actorEmail);
    if (!actorIsGlobal) {
      throw new ForbiddenException('Only global admins can remove users');
    }

    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepo.remove(user);
    await this.logsService.record(actorEmail, 'delete_user_from_organization', `user:${targetUserId}`);

    return { message: 'User removed successfully' };
  }
}
