/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserModalComponent } from '../../components/user-modal/user-modal.component';

@Component({
  selector: 'app-users',
  imports: [CommonModule, UserModalComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  user: any;

  showModal = false;
  editUser: any = null;

  constructor(private usersService: UsersService, private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.user$.value;
    this.loadUsers();
  }

  openModal(user: any = null) {
    this.editUser = user;
    this.showModal = true;
  }

  loadUsers() {
    this.usersService.getUsers().subscribe((res: any) => this.users = res);
  }

  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersService.deleteUser(userId).subscribe(() => this.loadUsers());
  }
}
