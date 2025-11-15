/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get(this.api, this.getAuthOptions());
  }

  createUser(user: any) {
    return this.http.post(this.api, user, this.getAuthOptions());
  }

  updateUser(id: number, user: any) {
    return this.http.put(`${this.api}/${id}`, user, this.getAuthOptions());
  }

  updatePassword(id: number, newPassword: string) {
    return this.http.put(`${this.api}/${id}/password`, { newPassword }, this.getAuthOptions());
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.api}/${id}`, this.getAuthOptions());
  }

  getUsersByOrg(orgId: string) {
    // Use the organizations controller member endpoint
    return this.http.get<any[]>(`http://localhost:3000/api/organizations/members/${orgId}`, this.getAuthOptions());
  }

  private getAuthOptions() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }
    return {};
  }
}
