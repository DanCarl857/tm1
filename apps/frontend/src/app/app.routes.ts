import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { UsersComponent } from './pages/users/users.component';
import { LogsComponent } from './pages/logs/logs.component';
import { RoleGuard } from './guards/role.guard';
import { SelectOrgComponent } from './pages/select-org/select-org.component';

export const routes: Routes = [
  { path: '', redirectTo: 'select-org', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [RoleGuard] },
  { path: 'select-org', component: SelectOrgComponent },
  { path: 'organizations', component: OrganizationsComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'users/org/:orgId', component: UsersComponent, canActivate: [RoleGuard], data: { roles: ['admin','org-admin'], orgParam: 'orgId' } },
  { path: 'users', component: UsersComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'logs', component: LogsComponent, canActivate: [RoleGuard], data: { roles: ['admin','org-admin'] } },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
