/* eslint-disable @angular-eslint/no-output-native */
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
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  userForm: FormGroup;

  roles = ['admin', 'org-admin', 'user', 'viewer'];

  constructor(private fb: FormBuilder, private usersService: UsersService) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      roles: [[], Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.user) {
      // Normalize different user role shapes coming from various endpoints:
      // - { roles: ['admin','user'] }
      // - { role: 'user' } (single role when listing org members)
      // - { orgRoles: [{ organizationId, organizationName, roles: [] }, ...] }
      let roleValues: string[] = [];
      if (Array.isArray(this.user.roles)) {
        roleValues = this.user.roles;
      } else if (this.user.role) {
        roleValues = [this.user.role];
      } else if (Array.isArray(this.user.orgRoles)) {
        const selectedOrg = localStorage.getItem('selected_org_id');
        if (selectedOrg) {
          const match = (this.user.orgRoles || []).find((o: any) => String(o.organizationId) === String(selectedOrg) || (o.organizationId === null && String(o.organizationId) === String(selectedOrg)));
          if (match && Array.isArray(match.roles)) roleValues = match.roles;
        }
        // fallback: flatten all orgRoles into a unique list
        if (roleValues.length === 0) {
          const all = new Set<string>();
          (this.user.orgRoles || []).forEach((o: any) => (o.roles || []).forEach((r: string) => all.add(r)));
          roleValues = Array.from(all.values());
        }
      }

      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        roles: roleValues
      });
      // when editing, clear password and make it optional
  this.userForm.get('password')?.setValue('');
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    } else {
      // creating new user: require password
      this.userForm.reset({ password: '', roles: [] });
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  save() {
    if (this.userForm.invalid) return;

    const payload = { ...this.userForm.value } as any;

    if (this.user) {
      // Edit user: optionally update password and roles
      const newPassword = payload.password;
      delete payload.password;

      // If we're editing user roles in the context of a selected organization, translate roles -> "orgId:role" strings
      const selectedOrg = localStorage.getItem('selected_org_id');
      if (payload.roles && selectedOrg) {
        payload.roles = (payload.roles || []).map((r: string) => `${selectedOrg}:${r}`);
      }

      const doUpdate = () => this.usersService.updateUser(this.user.id, payload).toPromise();

      // If password provided, call password endpoint first, then update other fields
      if (newPassword) {
        this.usersService.updatePassword(this.user.id, newPassword).subscribe(() => {
          doUpdate().then(() => {
            this.saved.emit();
            this.close.emit();
          });
        });
      } else {
        this.usersService.updateUser(this.user.id, payload).subscribe(() => {
          this.saved.emit();
          this.close.emit();
        });
      }
    } else {
      // Add new user: ensure password present
      if (!payload.password) return;
      // Attach selected organization context so backend can assign the selected roles to that org
      const selectedOrg = localStorage.getItem('selected_org_id');
      if (selectedOrg && payload.roles) payload.orgId = selectedOrg;

      this.usersService.createUser(payload).subscribe(() => {
        this.saved.emit();
        this.close.emit();
      });
    }
  }
}
