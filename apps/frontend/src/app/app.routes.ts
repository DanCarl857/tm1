import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { UsersComponent } from './pages/users/users.component';
import { LogsComponent } from './pages/logs/logs.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'organizations', component: OrganizationsComponent },
  { path: 'users/org/:orgId', component: UsersComponent },
  { path: 'users', component: UsersComponent },
  { path: 'logs', component: LogsComponent },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
