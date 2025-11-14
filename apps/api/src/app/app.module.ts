import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';
import { Task } from '../entities/task.entity';
import { Log } from '../entities/log.entity';

import { AuthModule } from '../auth/auth.module';
import { OrgsService } from '../orgs/orgs.service';
import { OrgsController } from '../orgs/orgs.controller';
import { UsersService } from '../users/users.service';
import { UsersController } from '../users/users.controller';
import { TasksService } from '../tasks/tasks.service';
import { TasksController } from '../tasks/tasks.controller';
import { LogsService } from '../logs/logs.service';
import { LogsController } from '../logs/logs.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/sqlite.db',
      entities: [User, Organization, Membership, Task, Log],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Organization, Membership, Task, Log]),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'dev_jwt_secret' }),
    AuthModule,
  ],
  controllers: [OrgsController, UsersController, TasksController, LogsController],
  providers: [OrgsService, UsersService, TasksService, LogsService],
})
export class AppModule {}
