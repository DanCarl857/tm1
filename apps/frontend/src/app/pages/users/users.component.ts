/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
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
  orgId: string | null = null;

  showModal = false;
  editUser: any = null;

  constructor(private usersService: UsersService, private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.user = this.auth.user$.value;
    this.route.paramMap.subscribe(params => {
      this.orgId = params.get('orgId');
      this.loadUsers();
    });
  }

  openModal(user: any = null) {
    this.editUser = user;
    this.showModal = true;
  }

  loadUsers() {
    if (this.orgId) {
      this.usersService.getUsersByOrg(this.orgId).subscribe((res: any) => this.users = res || []);
    } else {
      this.usersService.getUsers().subscribe((res: any) => this.users = res || []);
    }
  }

  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersService.deleteUser(userId).subscribe(() => this.loadUsers());
  }
}
