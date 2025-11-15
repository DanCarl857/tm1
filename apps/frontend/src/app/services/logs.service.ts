/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LogsService {
  private api = 'http://localhost:3000/api/logs';

  constructor(private http: HttpClient) {}

  getLogs() {
    return this.http.get(this.api);
  }
}
