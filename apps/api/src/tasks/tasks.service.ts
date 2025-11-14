import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Membership) private memRepo: Repository<Membership>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {}

  // helper: get roles of caller within org
  async getRoles(userId: string, orgId: string) {
    const mem = await this.memRepo.findOne({ where: { user: { id: userId }, organization: { id: orgId } }});
    return mem?.roles ?? [];
  }

  async createTask(actor: { userId: string, isGlobalAdmin: boolean}, dto: { title: string, description?: string, organizationId: string, assigneeIds?: string[] }) {
    // Only global admin, org-admin, or admin in the org can create tasks
    const roles = await this.getRoles(actor.userId, dto.organizationId);
    if (!actor.isGlobalAdmin && !roles.includes('admin') && !roles.includes('org-admin')) {
      throw new ForbiddenException('Not allowed to create tasks in this org');
    }

    const org = await this.orgRepo.findOne({ where: { id: dto.organizationId }});
    if (!org) throw new NotFoundException('Org not found');

    const task = this.taskRepo.create({ title: dto.title, description: dto.description, organization: org, createdBy: await this.userRepo.findOne({ where: { id: actor.userId }}) });
    if (dto.assigneeIds && dto.assigneeIds.length) {
      task.assignees = await this.userRepo.findByIds(dto.assigneeIds);
    } else {
      task.assignees = [];
    }
    return this.taskRepo.save(task);
  }

  async findForUser(userId: string) {
    // return tasks for orgs the user is a member of; viewers included if they are a member.
    const memberships = await this.memRepo.find({ where: { user: { id: userId } }, relations: ['organization'] });
    const orgIds = memberships.map(m => m.organization.id);
    if (orgIds.length === 0) return [];
    return this.taskRepo.createQueryBuilder('t')
      .where('t.organizationId IN (:...orgIds)', { orgIds })
      .leftJoinAndSelect('t.assignees', 'assignees')
      .getMany();
  }

  async findOne(userId: string, taskId: string) {
    const t = await this.taskRepo.findOne({ where: { id: taskId }});
    if (!t) throw new NotFoundException();
    // ensure user is a member of the org (or global admin)
    const mem = await this.memRepo.findOne({ where: { user: { id: userId }, organization: { id: t.organization.id } }});
    if (!mem) throw new ForbiddenException('Not a member of the organization');
    return t;
  }

  async updateTask(actor: { userId: string, isGlobalAdmin: boolean }, taskId: string, dto: { title?: string, description?: string, completed?: boolean, assigneeIds?: string[] }) {
    const task = await this.taskRepo.findOne({ where: { id: taskId }});
    if (!task) throw new NotFoundException('Task not found');

    const roles = await this.getRoles(actor.userId, task.organization.id);

    // Admins and org-admins can update freely
    if (actor.isGlobalAdmin || roles.includes('admin') || roles.includes('org-admin')) {
      task.title = dto.title ?? task.title;
      task.description = dto.description ?? task.description;
      if (dto.assigneeIds) {
        task.assignees = await this.userRepo.findByIds(dto.assigneeIds);
      }
      if (typeof dto.completed === 'boolean') task.completed = dto.completed;
      return this.taskRepo.save(task);
    }

    // Users can update only if they are assignees and the change is allowed (title/description? requirement: user role can update task in an org and mark as complete)
    const isAssignee = task.assignees.some(a => a.id === actor.userId);
    if (roles.includes('user') && isAssignee) {
      // allow marking complete and editing description/title if you want; we'll allow description and completed
      if (dto.title) task.title = dto.title;
      if (dto.description) task.description = dto.description;
      if (typeof dto.completed === 'boolean') task.completed = dto.completed;
      return this.taskRepo.save(task);
    }

    throw new ForbiddenException('Not allowed to update this task');
  }

  async removeTask(actor: { userId: string, isGlobalAdmin: boolean }, taskId: string) {
    const task = await this.taskRepo.findOne({ where: { id: taskId }});
    if (!task) throw new NotFoundException();
    const roles = await this.getRoles(actor.userId, task.organization.id);
    if (actor.isGlobalAdmin || roles.includes('admin') || roles.includes('org-admin')) {
      return this.taskRepo.remove(task);
    }
    throw new ForbiddenException('Not allowed to delete this task');
  }
}
