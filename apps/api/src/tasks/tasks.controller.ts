import { Controller, UseGuards, Req, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(@Req() req: any, @Body() body: { title: string; description?: string; organizationId: number; assigneeId?: number }) {
    const actorEmail = req.user?.email;
    const orgId = String(body.organizationId);

    const dto: any = {
      title: body.title,
      description: body.description,
    };

    if (body.assigneeId !== undefined && body.assigneeId !== null) {
      dto.assignees = [{ id: body.assigneeId }];
    }

    return this.tasksService.createTask(actorEmail, orgId, dto);
  }

  @Get()
  async list(@Req() req: any) {
    const actorEmail = req.user?.email;
    return this.tasksService.listTasksForUser(actorEmail);
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    const actorEmail = req.user?.email;
    return this.tasksService.getTask(actorEmail, id);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: { title?: string; description?: string; completed?: boolean; assigneeId?: number }) {
    const actorEmail = req.user?.email;
    return this.tasksService.updateTask(actorEmail, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const actorEmail = req.user?.email;
    return this.tasksService.deleteTask(actorEmail, id);
  }
}
