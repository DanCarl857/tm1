import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class OrgsService {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(Membership) private memRepo: Repository<Membership>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createOrg(name: string, actor: { userId: string }) {
    // only global admin (we'll treat user with email 'admin@local' OR seeded admin) should be able to do global actions;
    // but the simpler approach: caller must be global admin membership with role 'admin' in a special system org OR we check an env variable.
    const org = this.orgRepo.create({ name });
    return this.orgRepo.save(org);
  }

  async findAllForUser(userId: string) {
    const memberships = await this.memRepo.find({ where: { user: { id: userId } }, relations: ['organization'] });
    return memberships.map(m => ({ organization: m.organization, roles: m.roles }));
  }

  async findOne(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException();
    return org;
  }

  async updateOrg(id: string, name: string) {
    const org = await this.findOne(id);
    org.name = name ?? org.name;
    return this.orgRepo.save(org);
  }

  async removeOrg(id: string) {
    const org = await this.findOne(id);
    return this.orgRepo.remove(org);
  }
}
