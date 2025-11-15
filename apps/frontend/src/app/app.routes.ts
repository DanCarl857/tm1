import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { UsersComponent } from './pages/users/users.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'login', redirectTo: '', pathMatch: 'full', component: LoginComponent },
  { path: 'organizations', component: OrganizationsComponent },
  { path: 'user', component: UsersComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
