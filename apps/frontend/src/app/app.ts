/* eslint-disable @angular-eslint/prefer-inject */
import { Router, RouterModule } from '@angular/router';
import { Component, inject } from '@angular/core';
import { AuthService } from './services/auth.service';
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

  get isLoginRoute() {
    return this.router.url === '/' || this.router.url.startsWith('/login');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
