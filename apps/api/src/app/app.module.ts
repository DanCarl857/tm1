import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { Log } from '../entities/log.entity';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../orgs/orgs.module';
import { TasksModule } from '../tasks/tasks.module';
import { LogsModule } from '../logs/logs.module';
import { OrgsService } from '../orgs/orgs.service';
import { OrgsController } from '../orgs/orgs.controller';
import { UsersService } from '../users/users.service';
import { UsersController } from '../users/users.controller';
import { TasksService } from '../tasks/tasks.service';
import { TasksController } from '../tasks/tasks.controller';
import { LogsService } from '../logs/logs.service';
import { LogsController } from '../logs/logs.controller';
import { UserOrganizationRole } from '../entities/user-organization-role.entity';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/sqlite.db',
      entities: [User, Organization, UserOrganizationRole, Task, Log],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Organization, UserOrganizationRole, Task, Log]),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'dev_jwt_secret', signOptions: { expiresIn: '1d' } }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    TasksModule,
    LogsModule,
  ],
  controllers: [AuthController, LogsController, OrgsController, UsersController, TasksController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, OrgsService, UsersService, TasksService, LogsService],
})
export class AppModule {}
