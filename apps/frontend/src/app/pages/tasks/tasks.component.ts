/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskModalComponent } from '../../components/task-modal/task-modal.component';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule, TaskModalComponent],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];
  user: any;
  showModal = false;
  editTask: any = null;
  selectedOrgId: string | null = null;
  orgMembers: any[] = [];
  showAddSelector: { [taskId: string]: boolean } = {};
  topMessage: string | null = null;

  constructor(private tasksService: TasksService, private auth: AuthService, private usersService: UsersService) {}

  ngOnInit() {
    this.user = this.auth.user$.value;
    // load tasks for selected organization (fallback to localStorage)
    this.auth.selectedOrg$.subscribe(s => {
      this.selectedOrgId = s?.id ?? localStorage.getItem('selected_org_id');
      this.loadTasks();
      // load organization members for add/remove assignee actions
      const orgId = this.selectedOrgId ?? localStorage.getItem('selected_org_id');
      if (orgId) {
        this.usersService.getUsersByOrg(String(orgId)).subscribe((res: any[]) => {
          this.orgMembers = (res || []).map(u => ({ id: u.id, name: u.name, email: u.email }));
        }, () => this.orgMembers = []);
      } else {
        this.orgMembers = [];
      }
    });
  }

  // Check if user is admin (any org) or org-admin for selected org
  canCreateTask(): boolean {
    const u = this.user;
    const sel = this.selectedOrgId ?? localStorage.getItem('selected_org_id');
    if (!u || !u.roles) return false;
    const isAdminAnywhere = u.roles.some((r: any) => {
      if (!r) return false;
      if (typeof r === 'string') return r === 'admin';
      if (Array.isArray(r.roles)) return r.roles.includes('admin');
      if (typeof r.role === 'string') return r.role === 'admin';
      return false;
    });
    if (isAdminAnywhere) return true;
    // check org-admin in selected org
    return u.roles.some((r: any) => {
      if (!r) return false;
      const orgMatch = (r.organizationId && String(r.organizationId) === String(sel)) || (r.organization && r.organization.id && String(r.organization.id) === String(sel));
      if (!orgMatch) return false;
      if (Array.isArray(r.roles)) return r.roles.includes('org-admin') || r.roles.includes('admin');
      if (typeof r.role === 'string') return r.role === 'org-admin' || r.role === 'admin';
      return false;
    });
  }

  loadTasks() {
    this.tasksService.getTasks().subscribe(res => {
      const all = res as any[];
      const orgId = String(this.selectedOrgId ?? localStorage.getItem('selected_org_id'));
      if (orgId) {
        this.tasks = (all || []).filter(t => String(t.organization?.id) === orgId);
      } else {
        this.tasks = all || [];
      }
    });
  }

  // Admins/org-admins can add an assignee to a task
  addAssignee(task: any, userId: string) {
    if (!task || !userId) return;
    const existing = (task.assignees || []).map((a: any) => String(a.id));
    if (existing.includes(String(userId))) return;
    const newIds = [...existing, String(userId)];
    const payload = { assignees: newIds.map((id: string) => ({ id })) };
    this.tasksService.updateTask(task.id, payload).subscribe(() => {
      this.showAddSelector[task.id] = false;
      this.loadTasks();
    });
  }

  // Admins/org-admins can remove an assignee from a task
  removeAssignee(task: any, userId: string) {
    if (!task || !userId) return;
    const existing = (task.assignees || []).map((a: any) => String(a.id));
    const newIds = existing.filter((id: string) => id !== String(userId));
    const payload = { assignees: newIds.map((id: string) => ({ id })) };
    this.tasksService.updateTask(task.id, payload).subscribe(() => this.loadTasks());
  }

  isMemberAssigned(task: any, memberId: string): boolean {
    if (!task || !task.assignees) return false;
    return (task.assignees || []).some((a: any) => String(a.id) === String(memberId));
  }

  isAssignedTo(task: any): boolean {
    // task.assignees is an array of user objects (loaded from backend). Check if current user is in that list.
    if (!task || !task.assignees || !Array.isArray(task.assignees)) return false;
    return task.assignees.some((a: any) => String(a.id) === String(this.user?.id));
  }

  private hasRoleInSelectedOrg(roleName: string): boolean {
    const u = this.user;
    const sel = this.selectedOrgId ?? localStorage.getItem('selected_org_id');
    if (!u || !u.roles || !sel) return false;
    return u.roles.some((r: any) => {
      if (!r) return false;
      const orgMatch = (r.organizationId && String(r.organizationId) === String(sel)) || (r.organization && r.organization.id && String(r.organization.id) === String(sel));
      if (!orgMatch) return false;
      if (typeof r === 'string') return r === roleName;
      if (Array.isArray(r.roles)) return r.roles.includes(roleName);
      if (typeof r.role === 'string') return r.role === roleName;
      return false;
    });
  }

  canToggleComplete(task: any): boolean {
    // Admins/org-admins can always toggle
    if (this.canCreateTask()) return true;
    // Users assigned to the task with role 'user' can toggle
    if (this.isAssignedTo(task) && this.hasRoleInSelectedOrg('user')) return true;
    return false;
  }

  private showTopMessage(msg: string) {
    this.topMessage = msg;
    setTimeout(() => this.topMessage = null, 5000);
  }

  openModal(task: any = null, orgId: string | null = null) {
    this.editTask = task;
    this.selectedOrgId = orgId ?? task?.organizationId ?? null;
    this.showModal = true;
  }

  markComplete(task: any) {
    // Permission check: show top message if user can't toggle
    if (!this.canToggleComplete(task)) {
      this.showTopMessage('You do not have permission to change the status of this task.');
      return;
    }
    const currentlyCompleted = task.status === 'completed' || task.completed === true;
    const action = currentlyCompleted ? 'Mark this task as pending' : 'Mark this task as complete';
    if (!confirm(`${action}?`)) return;
    const newStatus = currentlyCompleted ? 'pending' : 'completed';
    const completedFlag = newStatus === 'completed';
    this.tasksService.updateTask(task.id, { completed: completedFlag }).subscribe({
      next: () => this.loadTasks(),
      error: (err: any) => {
        if (err?.status === 403) {
          this.showTopMessage('You do not have permission to change the status of this task.');
        } else {
          this.showTopMessage('Failed to update task status.');
        }
      }
    });
  }

  deleteTask(taskId: number) {
    if (!confirm('Delete this task?')) return;
    this.tasksService.deleteTask(taskId).subscribe(() => this.loadTasks());
  }
}
