import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import * as bcrypt from 'bcrypt';

export async function seedAdmin(app: INestApplication) {
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@system.com';
  const existing = await userRepository.findOne({ where: { email: adminEmail }});
  if (!existing) {
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'AdminPass123', 10);
    await userRepository.save({ email: adminEmail, password: hash, name: 'Super Admin', roles: ['admin'] });
    console.log('✔️ Admin seeded (admin@system.com / AdminPass123)', adminEmail);
  }
}