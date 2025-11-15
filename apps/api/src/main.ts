import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getRepository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  const repo = getRepository(User);
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@system.com';
  const existing = await repo.findOne({ where: { email: adminEmail }});
  if (!existing) {
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin123', 10);
    await repo.save({ email: adminEmail, passwordHash: hash });
    console.log('Seeded admin user:', adminEmail);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const config = new DocumentBuilder()
    .setTitle('TM API Documentation')
    .setDescription('Task manager API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  await seedAdmin();
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
