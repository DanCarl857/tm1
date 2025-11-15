/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { TasksService } from '../../services/tasks.service';
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

  constructor(private tasksService: TasksService, private auth: AuthService) {}

  ngOnInit() {
    this.user = this.auth.user$.value;
    // load tasks for selected organization (fallback to localStorage)
    this.auth.selectedOrg$.subscribe(s => {
      this.selectedOrgId = s?.id ?? localStorage.getItem('selected_org_id');
      this.loadTasks();
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

  isAssignedTo(task: any): boolean {
    return task.assignedTo === this.user.id;
  }

  openModal(task: any = null, orgId: string | null = null) {
    this.editTask = task;
    this.selectedOrgId = orgId ?? task?.organizationId ?? null;
    this.showModal = true;
  }

  markComplete(task: any) {
    if (!confirm('Mark this task as complete?')) return;
    this.tasksService.updateTask(task.id, { status: 'completed' }).subscribe(() => this.loadTasks());
  }

  deleteTask(taskId: number) {
    if (!confirm('Delete this task?')) return;
    this.tasksService.deleteTask(taskId).subscribe(() => this.loadTasks());
  }
}
