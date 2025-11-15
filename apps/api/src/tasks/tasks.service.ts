import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { UserOrganizationRole } from '../entities/user-organization-role.entity';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(UserOrganizationRole) private userOrgRoleRepo: Repository<UserOrganizationRole>,
    private logsService: LogsService,
  ) {}

  private isGlobalAdmin(email: string): boolean {
    const seed = process.env.SEED_ADMIN_EMAILS || 'admin@system.com';
    return email === seed;
  }

  private async getActorRoleInOrg(actorEmail: string, orgId: string) {
    const actor = await this.userRepo.findOne({ where: { email: actorEmail } });
    if (!actor) {
      throw new NotFoundException('Actor user not found');
    }

    const userOrgRole = await this.userOrgRoleRepo.findOne({
      where: { user: { id: actor.id }, organization: { id: orgId } },
      relations: ['role'],
    });

    return userOrgRole ? userOrgRole.role : null;
  }

  async createTask(actorEmail: string, orgId: string, dto: Partial<Task>) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const actorIsGlobal = this.isGlobalAdmin(actorEmail);
    const actorRole = await this.getActorRoleInOrg(actorEmail, orgId);

    if (!actorIsGlobal && actorRole !== 'admin' && actorRole !== 'org-admin') {
      throw new ForbiddenException('Insufficient permissions to create task');
    }
    
    const task = this.taskRepo.create({ title: dto.title, description: dto.description ?? '', organization: org, completed: false });
    if (dto.assignees && dto.assignees.length > 0) {
      const assignees = await this.userRepo.findByIds(dto.assignees.map(a => a.id));
      task.assignees = assignees;
    }

    const actor = await this.userRepo.findOne({ where: { email: actorEmail } });
    task.createdBy = actor || null;

    const savedTask = await this.taskRepo.save(task);

    await this.logsService.record(actorEmail, `Created task '${savedTask.title}' in organization '${org.name}'`);
    await this.taskRepo.save(task);
    return savedTask
  }

  async listTasksForUser(actorEmail: string) {
    const actor = await this.userRepo.findOne({ where: { email: actorEmail }, relations: ['orgRoles'] });
    if (!actor) throw new NotFoundException('Actor not found');

    const userOrgRole = await this.userOrgRoleRepo.find({
      where: { user: { id: actor.id } },
      relations: ['organization'],
    });

    const orgIds = userOrgRole.map(uor => uor.organization.id);

    const tasks = await this.taskRepo.find({
      where: { organization: { id: Not(orgIds.length > 0 ? '' : 'non-existent-id') } },
      relations: ['organization', 'assignees', 'createdBy'],
    });

    return tasks;
  }

  async getTask(actorEmail: string, taskId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['organization', 'assignees', 'createdBy'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const actorIsGlobal = this.isGlobalAdmin(actorEmail);
    const actorRole = await this.getActorRoleInOrg(actorEmail, task.organization.id);

    if (!actorIsGlobal && !actorRole) {
      throw new ForbiddenException('Insufficient permissions to view task');
    }

    await this.logsService.record(actorEmail, `Viewed task '${task.title}' in organization '${task.organization.name}'`);
    return task;
  }

  async updateTask(actorEmail: string, taskId: string, dto: Partial<Task>) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['organization', 'assignees', 'createdBy'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const actorIsGlobal = this.isGlobalAdmin(actorEmail);
    const actorRole = await this.getActorRoleInOrg(actorEmail, task.organization.id);

    // Admins/org-admins can update all fields
    if (actorIsGlobal || actorRole === 'admin' || actorRole === 'org-admin') {
      if (dto.title !== undefined) task.title = dto.title;
      if (dto.description !== undefined) task.description = dto.description;
      if (dto.completed !== undefined) task.completed = dto.completed;
      if (dto.assignees !== undefined) {
        const assignees = await this.userRepo.findByIds(dto.assignees.map(a => a.id));
        task.assignees = assignees;
      }

      const updatedTask = await this.taskRepo.save(task);

      await this.logsService.record(actorEmail, 'update_task', `Updated task '${updatedTask.title}' in organization '${task.organization.name}'`);
      return updatedTask;
    }

    if (actorRole === 'user') {
      // Regular users can only update the 'completed' status
      if (dto.completed !== undefined) {
        task.completed = dto.completed;
        const updatedTask = await this.taskRepo.save(task);

        await this.logsService.record(actorEmail, 'complete_task', `Completed task '${updatedTask.title}' in organization '${task.organization.name}'`);
        return updatedTask;
      } else {
        throw new ForbiddenException('Insufficient permissions to update this field');
      }
    }

    // Viewers cannot update tasks
    throw new ForbiddenException('Insufficient permissions to update task');
  }

  async deleteTask(actorEmail: string, taskId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['organization'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const actorIsGlobal = this.isGlobalAdmin(actorEmail);
    const actorRole = await this.getActorRoleInOrg(actorEmail, task.organization.id);

    if (!actorIsGlobal && actorRole !== 'admin' && actorRole !== 'org-admin') {
      throw new ForbiddenException('Insufficient permissions to delete task');
    }

    await this.taskRepo.remove(task);
    await this.logsService.record(actorEmail, 'delete_task', `Deleted task '${task.title}' from organization '${task.organization.name}'`);
    return { message: 'Task deleted successfully' };
  }

}
