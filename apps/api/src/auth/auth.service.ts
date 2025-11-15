import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
// import { Membership, OrgRole } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    private jwt: JwtService
  ) {}

  async register(email: string, password: string) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already exists');
    const hash = await bcrypt.hash(password, 10);
    const user = this.users.create();
    user.email = email;
    user.password = hash;
    return this.users.save(user);
  }

  async validateUser(email: string, password: string) {
    // load orgRoles so downstream login can include roles in the token/payload
    const user = await this.users.findOne({ where: { email }, relations: ['orgRoles', 'orgRoles.organization'] });
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException();
    return user;
  }

  async login(user: User) {
    // aggregate roles by organization for the token and response
    const orgMap = new Map<string, { organizationId: string; organizationName: string; roles: string[] }>();
    (user.orgRoles || []).forEach(r => {
      const orgId = r.organization?.id;
      const orgName = r.organization?.name;
      if (!orgId) return;
      if (!orgMap.has(orgId)) orgMap.set(orgId, { organizationId: orgId, organizationName: orgName || '', roles: [] });
      const entry = orgMap.get(orgId) as { organizationId: string; organizationName: string; roles: string[] };
      if (!entry.roles.includes(r.role)) entry.roles.push(r.role);
    });
    const aggregatedRoles = Array.from(orgMap.values());

    const payload = { email: user.email, sub: user.id, roles: aggregatedRoles };
    const accessToken = this.jwt.sign(payload);
    return { 
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: aggregatedRoles
      }
    };
  }

  // helper: attach membership when creating user into an org
  // async addMembership(user: User, orgId: string, roles: OrgRole[] = []) {
  //   const org = await this.orgRepo.findOne({ where: { id: orgId } });
  //   if (!org) throw new Error('Organization not found');
  //   const mem = this.memberships.create({ user, organization: org, roles });
  //   return this.memberships.save(mem);
  // }
}