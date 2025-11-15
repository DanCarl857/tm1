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

  // Note: controller passes userEmail in the body. Accept email here and resolve to user id.
  async addOrUpdateUserRole(actorEmail: string, targetUserEmail: string, orgId: string, roles: Role[]) {
    // validate roles
    const validRoles = ['admin', 'org-admin', 'user', 'viewer'];
    for (const r of roles) {
      if (!validRoles.includes(r)) throw new BadRequestException(`Invalid role specified: ${r}`);
    }

    const actorIsGlobalAdmin = this.isGlobalAdmin(actorEmail);
    if (!actorIsGlobalAdmin) {
      const actorUser = await this.userRepo.findOne({ where: { email: actorEmail } });
      if (!actorUser) throw new ForbiddenException('Actor not found');
      const actorRoles = await this.roleRepo.find({ where: { user: { id: actorUser.id }, organization: { id: orgId } } });
      if (!actorRoles || !actorRoles.some(ar => ar.role === 'admin' || ar.role === 'org-admin')) {
        throw new ForbiddenException('Insufficient permissions to assign roles in this organization');
      }
    }

    const targetUser = await this.userRepo.findOne({ where: { email: targetUserEmail } });
    if (!targetUser) throw new NotFoundException('Target user not found');

    // remove existing roles for this user-org (we'll replace them)
    const existing = await this.roleRepo.find({ where: { user: { id: targetUser.id }, organization: { id: orgId } } });
    if (existing.length) {
      await this.roleRepo.remove(existing);
    }

    // create new role rows for each requested role
    const toCreate: UserOrganizationRole[] = roles.map(r => this.roleRepo.create({ user: targetUser, organization: { id: orgId } as Organization, role: r }));
    const saved = await this.roleRepo.save(toCreate);
    await this.logsService.record(actorEmail, 'assign_role', `user:${targetUser.id} org:${orgId} roles:${roles.join(',')}`);
    return saved;
  }

  async removeUserRole(actorEmail: string, targetUserId: string, orgId: string) {
    const actorIsGlobalAdmin = this.isGlobalAdmin(actorEmail);
    if (!actorIsGlobalAdmin) {
      const actorUser = await this.userRepo.findOne({ where: { email: actorEmail } });
      if (!actorUser) throw new ForbiddenException('Actor not found');
      const actorRoles = await this.roleRepo.find({ where: { user: { id: actorUser.id }, organization: { id: orgId } } });
      if (!actorRoles || !actorRoles.some(ar => ar.role === 'admin' || ar.role === 'org-admin')) {
        throw new ForbiddenException('Insufficient permissions to remove roles in this organization');
      }
    }

    const userRoles = await this.roleRepo.find({ where: { user: { id: targetUserId }, organization: { id: orgId } } });
    if (!userRoles || userRoles.length === 0) {
      throw new NotFoundException('User role not found in the specified organization');
    }

    await this.roleRepo.remove(userRoles);
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
    const uors = await this.roleRepo.find({ where: { user: { id: userId }, organization: { id: orgId } } });
    if (!uors || uors.length === 0) return false;
    return uors.some(u => roles.includes(u.role));
  }
}
