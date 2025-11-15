/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { TasksService } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  tasks: any[] = [];
  user: any;

  constructor(private tasksService: TasksService, private auth: AuthService) {}

  ngOnInit() {
    this.user = this.auth.user$.value;
    this.loadTasks();
  }

  loadTasks() {
    this.tasksService.getTasks().subscribe((res: any) => this.tasks = res);
  }

  markComplete(task: any) {
    this.tasksService.updateTask(task.id, { completed: true }).subscribe(() => this.loadTasks());
  }

  deleteTask(task: any) {
    this.tasksService.deleteTask(task.id).subscribe(() => this.loadTasks());
  }
}
