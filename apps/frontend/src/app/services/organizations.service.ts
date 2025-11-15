/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private api = 'http://localhost:3000/api/organizations';

  constructor(private http: HttpClient) {}

  getOrganizations() {
    return this.http.get(this.api);
  }

  createOrganization(org: any) {
    return this.http.post(this.api, org);
  }

  updateOrganization(id: number, org: any) {
    return this.http.put(`${this.api}/${id}`, org);
  }

  deleteOrganization(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
