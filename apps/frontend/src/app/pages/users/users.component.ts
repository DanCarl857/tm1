/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  user: any;

  constructor(private usersService: UsersService, private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.user$.value;
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe((res: any) => this.users = res);
  }

  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersService.deleteUser(userId).subscribe(() => this.loadUsers());
  }
}
