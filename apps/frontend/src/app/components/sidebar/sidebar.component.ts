
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
  selectedOrgId: string | null = null;

  ngOnInit(): void {
    // subscribe to user changes and refresh org list accordingly
    this.auth.user$.subscribe((u: User | null) => {
      if (!u) {
        this.organizations = [];
        return;
      }

      // if admin, fetch all organizations from API
      const isAdminAnyOrg = Array.isArray(u.roles) && u.roles.some((r: UserRole) => Array.isArray(r.roles) && r.roles.includes('admin'));
      if (isAdminAnyOrg) {
        this.orgService.getOrganizations().subscribe((res: Array<{ id: string; name: string }>) => {
          this.organizations = (res || []).map((o) => ({ id: o.id, name: o.name }));
        }, () => (this.organizations = []));
      } else {
        // non-admins: list orgs they belong to using the roles payload
        this.organizations = (u.roles || []).map((r: UserRole) => ({ id: r.organizationId, name: r.organizationName }));
      }
      // update selected org id from auth.selectedOrg$ or localStorage
      const sel = this.auth.selectedOrg$.value;
      this.selectedOrgId = sel?.id ?? localStorage.getItem('selected_org_id');
    });
    // also watch for selected org changes
    this.auth.selectedOrg$.subscribe(s => this.selectedOrgId = s?.id ?? localStorage.getItem('selected_org_id'));
  }

  get user() {
    return this.auth.user$.value;
  }

  get isAdmin(): boolean {
    const user = this.user;
    if (!user || !user.roles) return false;
    // user.roles: [{ organizationId, organizationName, roles: [] }]
    return user.roles.some((orgRole: UserRole | any) => {
      // support multiple shapes: { roles: string[] } or { role: string } or plain string
      if (!orgRole) return false;
      if (typeof orgRole === 'string') return orgRole === 'admin';
      if (Array.isArray(orgRole.roles)) return orgRole.roles.includes('admin');
      if (typeof orgRole.role === 'string') return orgRole.role === 'admin';
      return false;
    });
  }

  get isOrgAdmin(): boolean {
    const user = this.user;
    if (!user || !user.roles) return false;
    return user.roles.some((orgRole: UserRole | any) => {
      if (!orgRole) return false;
      if (typeof orgRole === 'string') return orgRole === 'org-admin';
      if (Array.isArray(orgRole.roles)) return orgRole.roles.includes('org-admin');
      if (typeof orgRole.role === 'string') return orgRole.role === 'org-admin';
      return false;
    });
  }

  // Check whether the user has a specific role in the selected organization
  hasRoleInSelectedOrg(roleName: string) {
    const user = this.user;
    if (!user || !user.roles || !this.selectedOrgId) return false;
    return user.roles.some((r: UserRole | any) => {
      if (!r) return false;
      const orgIdMatch = (r.organizationId && String(r.organizationId) === String(this.selectedOrgId)) || (r.organization && r.organization.id && String(r.organization.id) === String(this.selectedOrgId));
      if (!orgIdMatch) return false;
      if (typeof r === 'string') return r === roleName;
      if (Array.isArray(r.roles)) return r.roles.includes(roleName);
      if (typeof r.role === 'string') return r.role === roleName;
      return false;
    });
  }

  get isAdminForSelectedOrg() {
    // global/admin anywhere should work as admin as well
    if (this.isAdmin) return true;
    return this.hasRoleInSelectedOrg('admin');
  }

  get isOrgAdminForSelectedOrg() {
    if (this.isOrgAdmin) return true;
    return this.hasRoleInSelectedOrg('org-admin');
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

  changeOrg() {
    try { localStorage.removeItem('selected_org_id'); } catch { console.log('Failed to remove selected org from localStorage'); }
    this.auth.setSelectedOrg(null);
    this.router.navigate(['/select-org']);
  }

  selectOrg(org: { id?: string; name?: string }) {
    if (!org || !org.id) return;
    try { localStorage.setItem('selected_org_id', String(org.id)); } catch { /* ignore */ }
    this.auth.setSelectedOrg({ id: String(org.id), name: org.name || '' });
    this.router.navigate(['/dashboard']);
  }

  isSelectedOrg(org: { id?: string; name?: string }) {
    if (!org || org.id === undefined || org.id === null) return false;
    return String(org.id) === String(this.selectedOrgId);
  }
}
