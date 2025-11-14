import { Controller, Post, Body, UseGuards, Req, Get, Param, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OrgsService } from './orgs.service';
import { Role } from '../entities/user-organization-role.entity';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private orgsService: OrgsService) {}

  @Post()
  async create(@Req() req: any, @Body() body: { name: string }) {
    const actorEmail = req.user.email;
    const created = await this.orgsService.createOrg(actorEmail, body.name);
    return created;
  }

  @Get('me')
  async myOrganizations(@Req() req: any) {
    const userId = req.user?.userId;
    return this.orgsService.listOrganizationForUser(userId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.orgsService.getOrganization(id)
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: { name: string }) {
    const actorEmail = req.user.email;
    return this.orgsService.updateOrganization(actorEmail, id, body.name);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const actorEmail = req.user.email;
    return this.orgsService.deleteOrganization(actorEmail, id);
  }

  @Post(':id/roles')
  async assignRole(@Req() req: any, @Param('id') id: string, @Body() body: { userEmail: string; role: string }) {
    const actorEmail = req.user?.email;
    return this.orgsService.addOrUpdateUserRole(actorEmail, id, body.userEmail, body.role as Role);
  }

  @Delete(':id/roles/:userId')
  async removeRole(@Req() req: any, @Param('id') id: string, @Param('userId') userId: string) {
    const actorEmail = req.user?.email;
    return this.orgsService.removeUserRole(actorEmail, id, userId);
  }
}
