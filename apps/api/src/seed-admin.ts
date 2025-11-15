import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { Organization } from "./entities/organization.entity";
import { UserOrganizationRole } from "./entities/user-organization-role.entity";
import * as bcrypt from 'bcrypt';

export async function seedAdmin(app: INestApplication) {
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);
  const orgRepository = dataSource.getRepository(Organization);
  const roleRepository = dataSource.getRepository(UserOrganizationRole);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@system.com';
  let adminUser = await userRepository.findOne({ where: { email: adminEmail }});
  if (!adminUser) {
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'AdminPass123', 10);
    adminUser = await userRepository.save({ email: adminEmail, password: hash, name: 'Super Admin' });
    console.log('✔️ Admin seeded (admin@system.com / AdminPass123)', adminEmail);
  }

  // Ensure there is a default organization for global admin role
  let org = await orgRepository.findOne({ where: { name: 'Global' } });
  if (!org) {
    org = await orgRepository.save({ name: 'Global' });
    console.log('✔️ Global organization created');
  }

  // Assign admin role to the seeded admin user in the Global organization
  const existingRole = await roleRepository.findOne({ where: { user: { id: adminUser.id }, organization: { id: org.id }, role: 'admin' } });
  if (!existingRole) {
    await roleRepository.save({ user: adminUser, organization: org, role: 'admin' });
    console.log('✔️ Admin role assigned to seeded admin user in Global organization');
  }
}