// apps/web/src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoginComponent } from './components/login/login.component';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserModalComponent } from './components/user-modal/user-modal.component';
import { OrganizationModalComponent } from './components/organization-modal/organization-modal.component';
import { TaskModalComponent } from './components/task-modal/task-modal.component';

@NgModule({
  declarations: [
    // AppComponent,
    // DashboardComponent,
    // UsersComponent,
    // OrganizationsComponent,
    // SidebarComponent,
    // LoginComponent,
    // UserModalComponent,
    // OrganizationModalComponent,
    // TaskModalComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }],
  // bootstrap: [AppComponent]
})
export class AppModule {}
