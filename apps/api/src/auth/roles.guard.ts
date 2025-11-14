import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserOrganizationRole } from "../entities/user-organization-role.entity";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        const userRoles: UserOrganizationRole[] = user.orgRoles;

        if (!user || !user.Roles) return false;

        return userRoles.some((userRole) => requiredRoles.includes(userRole.role));
    }
}