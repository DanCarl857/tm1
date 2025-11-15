/* eslint-disable @angular-eslint/prefer-inject */
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css']
})
export class TaskModalComponent implements OnChanges {
  @Input() task: any = null;
  @Input() show = false;
  @Input() organizationId: string | null | undefined = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  taskForm: FormGroup;
  usersInOrg: any[] = [];

  constructor(private fb: FormBuilder, private tasksService: TasksService, private usersService: UsersService) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      assignedUsers: [[]],
      status: ['pending', Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        assignedUsers: this.task.assignedUsers?.map((u: { id: string; }) => u.id) || [],
        status: this.task.status
      });
    } else {
      this.taskForm.reset({ status: 'pending', assignedUsers: [] });
    }

    if (this.organizationId) {
      this.loadUsers();
    }
  }

  loadUsers() {
    // organizationId is checked before calling loadUsers in ngOnChanges, so assert non-null here
    this.usersService.getUsersByOrg(this.organizationId!).subscribe(res => this.usersInOrg = res);
  }

  save() {
    if (this.taskForm.invalid) return;

    const payload = {
      ...this.taskForm.value,
      assignedUsers: this.taskForm.value.assignedUsers
    };

    if (this.task) {
      this.tasksService.updateTask(this.task.id, payload).subscribe(() => {
        this.saved.emit();
        this.closed.emit();
      });
    } else {
      this.tasksService.createTask({ ...payload, organizationId: this.organizationId }).subscribe(() => {
        this.saved.emit();
        this.closed.emit();
      });
    }
  }
}
