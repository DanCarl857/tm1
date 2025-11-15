/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

export interface UserRole {
  organizationId: string;
  organizationName: string;
  roles: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:3000';
  private tokenKey = 'jwt_token';
  user$ = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {}

  // initialize user$ from existing token (so UI shows correct menus after reload)
  private tryRestoreFromToken() {
    const t = this.token;
    if (!t) return;
    try {
      const parts = t.split('.');
      if (parts.length !== 3) return;
      const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));
      const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name || '',
        roles: payload.roles || []
      };
      this.user$.next(user);
    } catch {
      // ignore invalid token
    }
  }

  // run restore synchronously on service creation
  private _init = (() => { this.tryRestoreFromToken(); return true; })();

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string, user: User }>(`${this.api}/auth/login`, { email, password })
      .pipe(tap(res => {
        localStorage.setItem(this.tokenKey, res.accessToken);
        this.user$.next(res.user);
      }));
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.user$.next(null);
  }

  get token() {
    return localStorage.getItem(this.tokenKey);
  }

  get isLoggedIn() {
    return !!this.token;
  }
}
