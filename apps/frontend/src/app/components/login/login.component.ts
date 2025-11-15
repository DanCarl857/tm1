/* eslint-disable @angular-eslint/prefer-inject */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;
  
  constructor(private auth: AuthService, private router: Router) {}
  
  onSubmit(form: NgForm) {
    if (!form.valid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log(res);
        // Ensure accessToken is persisted (AuthService also stores it, but be explicit)
        try {
          if (res?.accessToken) localStorage.setItem('jwt_token', res.accessToken);
        } catch {
          console.log('Failed to store token in localStorage');
        }
        // After successful login, send user to organization selection first
        this.router.navigate(['/select-org']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed';
      }
    });
  }
}