/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get(this.api);
  }

  createUser(user: any) {
    return this.http.post(this.api, user);
  }

  updateUser(id: number, user: any) {
    return this.http.put(`${this.api}/${id}`, user);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getUsersByOrg(orgId: string) {
    return this.http.get<any[]>(`${this.api}?orgId=${orgId}`);
  }
}
