import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { LogsModule } from '../logs/logs.module';
import { UserOrganizationRole } from '../entities/user-organization-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserOrganizationRole, Organization]),
    LogsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
