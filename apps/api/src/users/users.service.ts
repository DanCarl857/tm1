import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Membership) private memRepo: Repository<Membership>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {}

  async createUser(actor: { userId: string, isGlobalAdmin: boolean}, dto: { email: string, password: string, orgId?: string, roles?: string[] }) {
    // actor: caller info (we'll use controllers to compute isGlobalAdmin)
    if (!actor.isGlobalAdmin && !dto.orgId) {
      throw new ForbiddenException('Only admins can create users without org');
    }
    // create user
    const hash = await bcrypt.hash(dto.password, 10);
    const u = this.userRepo.create({ email: dto.email, passwordHash: hash });
    const saved = await this.userRepo.save(u);

    // If orgId provided, create membership (only if caller is allowed)
    if (dto.orgId) {
      const org = await this.orgRepo.findOne({ where: { id: dto.orgId } });
      if (!org) throw new NotFoundException('Org not found');
      // cast dto.roles to the membership roles type to satisfy TypeORM/TypeScript typing
      const roles = (dto.roles ?? ['user']) as unknown as any;
      const mem = this.memRepo.create({ user: saved, organization: org, roles });
      await this.memRepo.save(mem);
    }

    return saved;
  }

  async updateMembership(actor: { userId: string, isGlobalAdmin: boolean}, userIdToUpdate: string, orgId: string, roles: string[]) {
    // Only admin or org-admin in that org can update memberships
    const mem = await this.memRepo.findOne({ where: { user: { id: userIdToUpdate }, organization: { id: orgId } }});
    if (!mem) throw new NotFoundException('Membership not found');
    // Caller checks are performed in controller or prior
    // cast incoming string[] to the membership roles type to satisfy TypeORM/TypeScript typing
    mem.roles = roles as unknown as any;
    return this.memRepo.save(mem);
  }

  async findUserByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }
}
