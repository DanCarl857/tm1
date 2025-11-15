/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.auth.user$.value as unknown;
    // require login
    if (!this.auth.isLoggedIn || !user) {
      this.router.navigate(['/login']);
      return false;
    }

  type RouteData = { roles?: string[]; orgParam?: string };
  const data = route.data as unknown as RouteData;
  const requiredRoles: string[] = data?.roles || [];
  const orgParam: string | undefined = data?.orgParam;

    // if no specific role required, allow access
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // helper to test a role object for a role name
    const roleMatches = (roleObj: unknown, roleName: string) => {
      if (!roleObj) return false;
      if (typeof roleObj === 'string') return roleObj === roleName;
      if (typeof roleObj === 'object') {
        const obj = roleObj as Record<string, unknown>;
  if (Array.isArray(obj['roles'])) return (obj['roles'] as string[]).includes(roleName);
  if (typeof obj['role'] === 'string') return obj['role'] === roleName;
      }
      return false;
    };

    // Check for global role first (any role entry that is a bare 'admin' or roles array containing 'admin')
    const userObj = user as Record<string, unknown>;
  const rolesArray: unknown[] = Array.isArray(userObj['roles']) ? (userObj['roles'] as unknown[]) : [];
    for (const r of rolesArray) {
      for (const need of requiredRoles) {
        if (roleMatches(r, need)) return true;
      }
    }

    // If an org-specific role is acceptable, check the selected org or route param
    const orgId = orgParam ? String(route.params[orgParam] || '') : (this.auth.selectedOrg$.value?.id ?? localStorage.getItem('selected_org_id'));
    if (orgId) {
      // check user.roles for a role in this org
      const hasOrgRole = rolesArray.some((r) => {
        if (typeof r !== 'object' || r === null) return false;
        const robj = r as Record<string, unknown>;
        let orgMatch = false;
        if ('organizationId' in robj && robj['organizationId']) {
          orgMatch = String(robj['organizationId']) === String(orgId);
        } else if ('organization' in robj && typeof robj['organization'] === 'object' && robj['organization'] !== null) {
          const org = robj['organization'] as Record<string, unknown>;
          if ('id' in org && org['id']) orgMatch = String(org['id']) === String(orgId);
        }
        if (!orgMatch) return false;
        return requiredRoles.some(rr => roleMatches(r, rr));
      });
      if (hasOrgRole) return true;
    }

    // no match -> redirect to dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
