
import { Component, inject, OnInit } from '@angular/core';
import { AuthService, User, UserRole } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrganizationsService } from '../../services/organizations.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  orgService = inject(OrganizationsService);

  organizations: Array<{ id?: string; name: string }> = [];

  ngOnInit(): void {
    // subscribe to user changes and refresh org list accordingly
    this.auth.user$.subscribe((u: User | null) => {
      if (!u) {
        this.organizations = [];
        return;
      }

      // if admin, fetch all organizations from API
      const isAdmin = Array.isArray(u.roles) && u.roles.some((r: UserRole) => Array.isArray(r.roles) && r.roles.includes('admin'));
      if (isAdmin) {
        this.orgService.getOrganizations().subscribe((res: Array<{ id: string; name: string }>) => {
          this.organizations = (res || []).map((o) => ({ id: o.id, name: o.name }));
        }, () => (this.organizations = []));
      } else {
        // non-admins: list orgs they belong to using the roles payload
        this.organizations = (u.roles || []).map((r: UserRole) => ({ id: r.organizationId, name: r.organizationName }));
      }
    });
  }

  get user() {
    return this.auth.user$.value;
  }

  get isAdmin(): boolean {
    const user = this.user;
    if (!user || !user.roles) return false;
    // user.roles: [{ organizationId, organizationName, roles: [] }]
    return user.roles.some((orgRole: UserRole) => Array.isArray(orgRole.roles) && orgRole.roles.includes('admin'));
  }

  get isOrgAdmin(): boolean {
    const user = this.user;
    if (!user || !user.roles) return false;
    return user.roles.some((orgRole: UserRole) => Array.isArray(orgRole.roles) && orgRole.roles.includes('org-admin'));
  }

  /** Return organization entries where the current user has at least org-admin role */
  get orgsWhereUserIsOrgAdmin() {
    const user = this.user;
    if (!user || !user.roles) return [];
    return (user.roles || [])
      .filter((r: UserRole) => Array.isArray(r.roles) && r.roles.includes('org-admin'))
      .map((r: UserRole) => ({ id: r.organizationId, name: r.organizationName }));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
