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
  selectedOrgId: number | null = null;

  constructor(private tasksService: TasksService, private auth: AuthService) {}

  ngOnInit() {
    this.user = this.auth.user$.value;
    this.loadTasks();
  }

  loadTasks() {
    this.tasksService.getTasks().subscribe(res => this.tasks = res as any[]);
  }

  isAssignedTo(task: any): boolean {
    return task.assignedTo === this.user.id;
  }

  openModal(task: any = null, orgId: number | null = null) {
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
