/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { OrganizationsService } from '../../services/organizations.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.css']
})
export class OrganizationsComponent implements OnInit {
  organizations: any[] = [];
  user: any;

  constructor(private orgService: OrganizationsService, private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.user$.value;
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.orgService.getOrganizations().subscribe((res: any) => this.organizations = res);
  }

  deleteOrg(orgId: number) {
    if (!confirm('Are you sure you want to delete this organization?')) return;
    this.orgService.deleteOrganization(orgId).subscribe(() => this.loadOrganizations());
  }
}
