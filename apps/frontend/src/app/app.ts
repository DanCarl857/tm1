/* eslint-disable @angular-eslint/prefer-inject */
import { Router, RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  protected title = 'Task Management';

  constructor(public auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
