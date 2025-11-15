import { Controller, Req, Post, Body, UseGuards, Get, Param, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async listAll(@Req() req: any) {
    const actorEmail = req.user?.email;
    return this.usersService.listAllUsers(actorEmail);
  }

  @Post()
  async create(@Req() req: any, @Body() body: { email: string; password: string; name: string, orgId?: string; roles?: string[] }) {
    const actorEmail = req.user?.email;
    return this.usersService.createUser(actorEmail, body);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: { name?: string; email?: string, roles?: string[] }) {
    const actorEmail = req.user?.email;
    return this.usersService.updateUser(actorEmail, id, body);
  }

  @Put(':id/password')
  async updatePassword(@Req() req: any, @Param('id') id: string, @Body() body: { newPassword: string }) {
    const actorEmail = req.user?.email;
    return this.usersService.updatePassword(actorEmail, id, body.newPassword);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get(':id/roles')
  async getRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(id);
  }

  @Get('org/:orgId')
  async listUsersInOrganization(@Req() req: any, @Param('orgId') orgId: string) {
    const actorEmail = req.user?.email;
    return this.usersService.listUsersInOrganization(actorEmail, orgId);
  }

  @Delete(':id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    const actorEmail = req.user?.email;
    return this.usersService.deleteUser(actorEmail, id);
  }
}
