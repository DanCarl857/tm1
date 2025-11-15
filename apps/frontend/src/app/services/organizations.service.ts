/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Organization {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private api = 'http://localhost:3000/api/organizations';

  constructor(private http: HttpClient) {}

  getOrganizations() {
    return this.http.get<Organization[]>(this.api, this.getAuthOptions());
  }

  getMyOrganizations() {
    console.log('Fetching my organizations with auth options:', this.getAuthOptions());
    return this.http.get<Organization[]>(`${this.api}/me`, this.getAuthOptions());
  }

  createOrganization(org: any) {
    return this.http.post(this.api, org, this.getAuthOptions());
  }

  updateOrganization(id: number, org: any) {
    return this.http.put(`${this.api}/${id}`, org, this.getAuthOptions());
  }

  deleteOrganization(id: number) {
    return this.http.delete(`${this.api}/${id}`, this.getAuthOptions());
  }

  private getAuthOptions() {
    const token = localStorage.getItem('jwt_token');
    console.log('Using token in OrganizationsService:', token);
    if (token) {
      return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }
    return {};
  }
}
