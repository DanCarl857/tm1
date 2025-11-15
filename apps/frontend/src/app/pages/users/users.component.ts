/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserModalComponent } from '../../components/user-modal/user-modal.component';

@Component({
  selector: 'app-users',
  imports: [CommonModule, UserModalComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  user: any;
  orgId: string | null = null;

  showModal = false;
  editUser: any = null;

  constructor(private usersService: UsersService, private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.user = this.auth.user$.value;
    this.route.paramMap.subscribe(params => {
      this.orgId = params.get('orgId');
      this.loadUsers();
    });
  }

  canCreateUser(): boolean {
    const u = this.user;
    const sel = this.orgId ?? localStorage.getItem('selected_org_id');
    if (!u || !u.roles) return false;
    const isAdminAnywhere = u.roles.some((r: any) => {
      if (!r) return false;
      if (typeof r === 'string') return r === 'admin';
      if (Array.isArray(r.roles)) return r.roles.includes('admin');
      if (typeof r.role === 'string') return r.role === 'admin';
      return false;
    });
    if (isAdminAnywhere) return true;
    // org-admin for selected org
    return u.roles.some((r: any) => {
      if (!r) return false;
      const orgMatch = (r.organizationId && String(r.organizationId) === String(sel)) || (r.organization && r.organization.id && String(r.organization.id) === String(sel));
      if (!orgMatch) return false;
      if (Array.isArray(r.roles)) return r.roles.includes('org-admin') || r.roles.includes('admin');
      if (typeof r.role === 'string') return r.role === 'org-admin' || r.role === 'admin';
      return false;
    });
  }

  openModal(user: any = null) {
    // Normalize incoming user object shapes (some endpoints return userId and role)
    if (user && !user.id && (user as any).userId) {
      user.id = (user as any).userId;
    }
    this.editUser = user;
    this.showModal = true;
  }

  loadUsers() {
    const orgToUse = this.orgId ?? localStorage.getItem('selected_org_id');
    if (orgToUse) {
      this.usersService.getUsersByOrg(orgToUse).subscribe((res: any) => this.users = res || []);
    } else {
      this.usersService.getUsers().subscribe((res: any) => this.users = res || []);
    }
  }

  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersService.deleteUser(userId).subscribe(() => this.loadUsers());
  }
}
