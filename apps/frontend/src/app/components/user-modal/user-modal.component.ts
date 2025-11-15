/* eslint-disable @angular-eslint/prefer-inject */
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.css']
})
export class UserModalComponent implements OnChanges {
  @Input() user: any = null; // null for Add, filled for Edit
  @Input() show = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  userForm: FormGroup;

  roles = ['admin', 'org-admin', 'user', 'viewer'];

  constructor(private fb: FormBuilder, private usersService: UsersService) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roles: [[], Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.user) {
      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        roles: this.user.roles
      });
    } else {
      this.userForm.reset({ roles: [] });
    }
  }

  save() {
    if (this.userForm.invalid) return;

    const payload = this.userForm.value;

    if (this.user) {
      // Edit user
      this.usersService.updateUser(this.user.id, payload).subscribe(() => {
        this.saved.emit();
        this.closed.emit();
      });
    } else {
      // Add new user
      this.usersService.createUser(payload).subscribe(() => {
        this.saved.emit();
        this.closed.emit();
      });
    }
  }
}
