/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { OrganizationsService } from '../../services/organizations.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrganizationModalComponent } from '../../components/organization-modal/organization-modal.component';

@Component({
  selector: 'app-organizations',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, OrganizationModalComponent],
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.css']
})
export class OrganizationsComponent implements OnInit {
  organizations: any[] = [];
  user: any;

  showModal = false;
  editOrg: any = null;

  constructor(private orgService: OrganizationsService, private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.user$.value;
    this.loadOrganizations();
  }

  // Check if the current user has an admin role in any shape
  isAdminAny(): boolean {
    const u = this.user;
    if (!u || !u.roles) return false;
    return u.roles.some((r: any) => {
      if (!r) return false;
      if (typeof r === 'string') return r === 'admin';
      if (Array.isArray(r.roles)) return r.roles.includes('admin');
      if (typeof r.role === 'string') return r.role === 'admin';
      return false;
    });
  }

  openModal(org: any = null) {
    this.editOrg = org;
    this.showModal = true;
  }

  loadOrganizations() {
    this.orgService.getOrganizations().subscribe((res: any) => this.organizations = res);
  }

  deleteOrg(orgId: number) {
    if (!confirm('Are you sure you want to delete this organization?')) return;
    this.orgService.deleteOrganization(orgId).subscribe(() => this.loadOrganizations());
  }
}
