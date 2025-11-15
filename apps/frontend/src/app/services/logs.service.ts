/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LogsService {
  private api = 'http://localhost:3000/api/logs';

  constructor(private http: HttpClient) {}

  getLogs() {
    return this.http.get(this.api, this.getAuthOptions());
  }

  private getAuthOptions() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }
    return {};
  }
}
