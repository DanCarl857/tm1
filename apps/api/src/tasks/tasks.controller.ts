import { Controller, UseGuards, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../common/user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post()
  async create(@Body() body: any, @CurrentUser() user) {
    const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@local';
    const isGlobalAdmin = user?.email === seedAdminEmail;
    return this.tasks.createTask({ userId: user.userId, isGlobalAdmin }, body);
  }

  @Get()
  async list(@CurrentUser() user) {
    return this.tasks.findForUser(user.userId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user) {
    return this.tasks.findOne(user.userId, id);
  }
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser() user) {
    const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@local';
    const isGlobalAdmin = user?.email === seedAdminEmail;
    return this.tasks.updateTask({ userId: user.userId, isGlobalAdmin }, id, body);
  }
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user) {
    const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@local';
    const isGlobalAdmin = user?.email === seedAdminEmail;
    return this.tasks.removeTask({ userId: user.userId, isGlobalAdmin }, id);
  }
}
