/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private api = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks() {
    return this.http.get(this.api, this.getAuthOptions());
  }

  createTask(task: any) {
    return this.http.post(this.api, task, this.getAuthOptions());
  }

  updateTask(id: number, task: any) {
    return this.http.put(`${this.api}/${id}`, task, this.getAuthOptions());
  }

  deleteTask(id: number) {
    return this.http.delete(`${this.api}/${id}`, this.getAuthOptions());
  }

  private getAuthOptions() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }
    return {};
  }
}
