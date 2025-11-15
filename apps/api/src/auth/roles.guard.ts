import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserOrganizationRole } from "../entities/user-organization-role.entity";

type JwtAggregatedRole = { organizationId: string; organizationName: string; roles: string[] };

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user as { roles?: JwtAggregatedRole[]; orgRoles?: UserOrganizationRole[] } | undefined;
        if (!user) return false;

        // First, try JWT-style aggregated roles (array of { organizationId, organizationName, roles: [] })
        if (Array.isArray(user.roles)) {
            for (const orgRole of user.roles) {
                if (orgRole && Array.isArray(orgRole.roles)) {
                    if (orgRole.roles.some((r) => requiredRoles.includes(r))) return true;
                }
            }
        }

        // Fallback: entity-style orgRoles on the user object (UserOrganizationRole[])
        if (Array.isArray(user.orgRoles)) {
            if (user.orgRoles.some((ur) => requiredRoles.includes(ur.role))) return true;
        }

        return false;
    }
}