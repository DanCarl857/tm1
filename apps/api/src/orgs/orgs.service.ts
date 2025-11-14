import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Role, UserOrganizationRole } from '../entities/user-organization-role.entity';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class OrgsService {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserOrganizationRole) private roleRepo: Repository<UserOrganizationRole>,
    private logsService: LogsService,
  ) {}

  private isGlobalAdmin(email: string) {
    const seed = process.env.SEED_ADMIN_EMAIL || 'admin@system.com';
    return email === seed;
  }

  async createOrg(actorEmail: string, name: string) {
    if (!this.isGlobalAdmin(actorEmail)) {
      throw new ForbiddenException();
    }
    const existing = await this.orgRepo.findOne({ where: { name } });
    if (existing) {
      throw new ForbiddenException('Organization with this name already exists');
    }
    const org = this.orgRepo.create({ name });
    const savedOrg = await this.orgRepo.save(org);
    await this.logsService.record(actorEmail, 'create_organization', `org:${savedOrg.id}`);
    return savedOrg;
  }

  async updateOrganization(actorEmail: string, orgId: string, newName: string) {
    if (!this.isGlobalAdmin(actorEmail)) {
      throw new ForbiddenException('Only global admins can update organizations');
    }
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    org.name = newName ?? org.name;
    const updatedOrg = await this.orgRepo.save(org);
    await this.logsService.record(actorEmail, 'update_organization', `org:${orgId}`);
    return updatedOrg;
  }

  async deleteOrganization(actorEmail: string, orgId: string) {
    if (!this.isGlobalAdmin(actorEmail)) {
      throw new ForbiddenException('Only global admins can delete organizations');
    }
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    await this.orgRepo.remove(org);
    await this.logsService.record(actorEmail, 'delete_organization', `org:${orgId}`);
    return { message: 'Organization deleted successfully' };
  }

  async addOrUpdateUserRole(actorEmail: string, targetUserId: string, orgId: string, role: Role) {
    const valid = ['admin', 'org-admin', 'user', 'viewer'].includes(role);
    if (!valid) {
      throw new BadRequestException('Invalid role specified');
    }

    const actorIsGlobalAdmin = this.isGlobalAdmin(actorEmail);
    if (!actorIsGlobalAdmin) {
      const actorUser = await this.userRepo.findOne({ where: { email: actorEmail } });
      if (!actorUser) throw new ForbiddenException('Actor not found');
      const actorRole = await this.roleRepo.findOne({ where: { user: { id: actorUser.id }, organization: { id: orgId } } });
      if (!actorRole || (actorRole.role !== 'admin' && actorRole.role !== 'org-admin')) {
        throw new ForbiddenException('Insufficient permissions to assign roles in this organization');
      }
    }

    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Target user not found');

    let userRole = await this.roleRepo.findOne({ where: { user: { id: targetUserId }, organization: { id: orgId } } });
    if (userRole) {
      userRole.role = role;
    } else {
      userRole = this.roleRepo.create({ user: targetUser, organization: { id: orgId } as Organization, role });
    }

    const saved = await this.roleRepo.save(userRole);
    await this.logsService.record(actorEmail, 'assign_role', `user:${targetUserId} org:${orgId} role:${role}`);
    return saved;
  }

  async removeUserRole(actorEmail: string, targetUserId: string, orgId: string) {
    const actorIsGlobalAdmin = this.isGlobalAdmin(actorEmail);
    if (!actorIsGlobalAdmin) {
      const actorUser = await this.userRepo.findOne({ where: { email: actorEmail } });
      if (!actorUser) throw new ForbiddenException('Actor not found');
      const actorRole = await this.roleRepo.findOne({ where: { user: { id: actorUser.id }, organization: { id: orgId } } });
      if (!actorRole || (actorRole.role !== 'admin' && actorRole.role !== 'org-admin')) {
        throw new ForbiddenException('Insufficient permissions to remove roles in this organization');
      }
    }

    const userRole = await this.roleRepo.findOne({ where: { user: { id: targetUserId }, organization: { id: orgId } } });
    if (!userRole) {
      throw new NotFoundException('User role not found in the specified organization');
    }

    await this.roleRepo.remove(userRole);
    await this.logsService.record(actorEmail, 'remove_role', `user:${targetUserId} org:${orgId}`);
    return { message: 'User role removed successfully' };
  }

  async listOrganizationForUser(userId: string) {
    const roles = await this.roleRepo.find({
      where: { user: { id: userId } },
      relations: ['organization'],
    });
    return roles.map((r) => r.organization);
  }

  async getOrganization(orgId: string) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async userHasRoleInOrg(userId: string, orgId: string, roles: Role[]) {
    const uor = await this.roleRepo.findOne({ where: { user: { id: userId }, organization: { id: orgId } }});
    if (!uor) return false;
    return roles.includes(uor.role);
  }
}
