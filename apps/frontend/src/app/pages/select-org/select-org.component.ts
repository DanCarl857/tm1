/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { AuthService, UserRole } from '../../services/auth.service';
import { OrganizationsService } from '../../services/organizations.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-select-org',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './select-org.component.html',
  styleUrls: ['./select-org.component.css']
})
export class SelectOrgComponent implements OnInit {
  auth!: AuthService;
  organizations: { id: string; name: string }[] = [];
  selectedId: string | null = null;
  error = '';

  constructor(private router: Router, private authService: AuthService, private orgService: OrganizationsService) {
    this.auth = this.authService;
  }

  ngOnInit(): void {
    const user = this.auth.user$.value;
    if (!user) {
      // no user - go to login
      this.router.navigate(['/login']);
      return;
    }

    // Fetch organizations for this user from the API (uses JWT in Authorization header)
    this.orgService.getMyOrganizations().subscribe({
      next: (res: Array<{ id: string; name: string }>) => {
        this.organizations = res || [];
        if (this.organizations.length === 1) {
          this.selectOrg(this.organizations[0].id);
        }
      },
      error: (err) => {
        // If API fails, fall back to building list from token-derived roles
        console.warn('Failed to load organizations from API, falling back to token roles', err);
        this.organizations = (user.roles || []).map((r: UserRole) => ({ id: r.organizationId, name: r.organizationName }));
        if (this.organizations.length === 1) {
          this.selectOrg(this.organizations[0].id);
        }
      }
    });
  }

  selectOrg(orgId?: string) {
    const id = orgId ?? this.selectedId;
    if (!id) return;
    const org = this.organizations.find(o => o.id === id) || null;
    if (!org) {
      this.error = 'Organization not found';
      return;
    }
    this.auth.setSelectedOrg(org);
    try {
      localStorage.setItem('selected_org_id', org.id);
    } catch {
        console.log('Failed to store selected org in localStorage');
    }
    this.router.navigate(['/dashboard']);
  }
}
