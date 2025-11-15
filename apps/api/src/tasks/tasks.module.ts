import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { LogsModule } from '../logs/logs.module';
import { UserOrganizationRole } from '../entities/user-organization-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, UserOrganizationRole,Organization]),
    LogsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, TypeOrmModule],
})
export class TasksModule {}

