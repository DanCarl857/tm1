/* eslint-disable @angular-eslint/prefer-inject */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (!form.valid) return;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']); // Redirect to dashboard
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed';
      }
    });
  }
}
