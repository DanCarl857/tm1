/* eslint-disable @angular-eslint/prefer-inject */
import { Router, RouterModule } from '@angular/router';
import { Component, inject } from '@angular/core';
import { AuthService, UserRole } from './services/auth.service';
import { CommonModule } from '@angular/common';
@Component({
  imports: [
    CommonModule,
    RouterModule,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  protected title = 'Task Management';
  auth = inject(AuthService);
  router = inject(Router);

  get user() {
    return this.auth.user$.value;
  }

  get isAdmin(): boolean {
    const u = this.user;
    if (!u || !u.roles) return false;
  return u.roles.some((r: UserRole) => Array.isArray(r.roles) && r.roles.includes('admin'));
  }

  get isOrgAdmin(): boolean {
    const u = this.user;
    if (!u || !u.roles) return false;
  return u.roles.some((r: UserRole) => Array.isArray(r.roles) && r.roles.includes('org-admin'));
  }

  get isLoginRoute() {
    return this.router.url === '/' || this.router.url.startsWith('/login') || this.router.url.startsWith('/select-org');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
