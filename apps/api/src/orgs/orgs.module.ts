import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgsService } from './orgs.service';
import { OrgsController } from './orgs.controller';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { LogsModule } from '../logs/logs.module';
import { UserOrganizationRole } from '../entities/user-organization-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, UserOrganizationRole]),
    LogsModule,
  ],
  controllers: [OrgsController],
  providers: [OrgsService],
  exports: [OrgsService, TypeOrmModule],
})
export class OrganizationsModule {}
