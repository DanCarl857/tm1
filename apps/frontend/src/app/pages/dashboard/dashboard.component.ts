/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { TaskModalComponent } from '../../components/task-modal/task-modal.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TaskModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
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
    console.log(this.user);
    // watch selected org and load tasks + org members
    this.auth.selectedOrg$.subscribe(s => {
      this.selectedOrgId = s?.id ?? localStorage.getItem('selected_org_id');
      this.loadTasks();
      const orgId = this.selectedOrgId ?? localStorage.getItem('selected_org_id');
      if (orgId) {
        this.usersService.getUsersByOrg(String(orgId)).subscribe((res: any[]) => this.orgMembers = (res || []).map(u => ({ id: u.id, name: u.name, email: u.email })), () => this.orgMembers = []);
      } else {
        this.orgMembers = [];
      }
    });
  }

  openModal(task: any = null) {
    this.editTask = task;
    this.showModal = true;
  }

  canCreateTask(): boolean {
    const u = this.user;
    const sel = localStorage.getItem('selected_org_id');
    if (!u || !u.roles) return false;
    const isAdminAnywhere = u.roles.some((r: any) => {
      if (!r) return false;
      if (typeof r === 'string') return r === 'admin';
      if (Array.isArray(r.roles)) return r.roles.includes('admin');
      if (typeof r.role === 'string') return r.role === 'admin';
      return false;
    });
    if (isAdminAnywhere) return true;
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
    this.tasksService.getTasks().subscribe((res: any) => {
      const all = res as any[];
      const orgId = String(this.selectedOrgId ?? localStorage.getItem('selected_org_id'));
      if (orgId) {
        this.tasks = (all || []).filter(t => String(t.organization?.id) === orgId);
      } else {
        this.tasks = all || [];
      }
    });
  }

  markComplete(task: any) {
    if (!this.canToggleComplete(task)) {
      this.showTopMessage('You do not have permission to change the status of this task.');
      return;
    }
    const currentlyCompleted = task.status === 'completed' || task.completed === true;
    const action = currentlyCompleted ? 'mark this task as pending' : 'mark this task as complete';
    if (!confirm(`${action}?`)) return;
    const newStatus = currentlyCompleted ? 'pending' : 'completed';
    const completedFlag = newStatus === 'completed';
    this.tasksService.updateTask(task.id, { completed: completedFlag }).subscribe({
      next: () => this.loadTasks(),
      error: (err: any) => {
        if (err?.status === 403) {
          this.showTopMessage('You do not the necessary permissions to change the status of this task.');
        } else {
          this.showTopMessage('Failed to update task status.');
        }
      }
    });
  }

  private hasRoleInSelectedOrg(roleName: string) {
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
    if (this.canCreateTask()) return true;
    if (this.isAssignedTo(task) && this.hasRoleInSelectedOrg('user')) return true;
    return false;
  }

  private showTopMessage(msg: string) {
    this.topMessage = msg;
    setTimeout(() => this.topMessage = null, 5000);
  }

  deleteTask(task: any) {
    if (!confirm('Delete this task?')) return;
    this.tasksService.deleteTask(task.id).subscribe(() => this.loadTasks());
  }

  addAssignee(task: any, userId: string) {
    if (!task || !userId) return;
    const existing = (task.assignees || []).map((a: any) => String(a.id));
    if (existing.includes(String(userId))) return;
    const newIds = [...existing, String(userId)];
    const payload = { assignees: newIds.map((id: string) => ({ id })) };
    this.tasksService.updateTask(task.id, payload).subscribe(() => { this.showAddSelector[task.id] = false; this.loadTasks(); });
  }

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
    if (!task || !task.assignees || !Array.isArray(task.assignees)) return false;
    return task.assignees.some((a: any) => String(a.id) === String(this.user?.id));
  }
}
