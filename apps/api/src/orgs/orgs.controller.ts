import { Controller, Post, Body, UseGuards, Get, Param, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OrgsService } from './orgs.service';
import { CurrentUser } from '../common/user.decorator';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private orgs: OrgsService) {}

  @Post()
  async create(@Body() body: { name: string }, @CurrentUser() user) {
    // only global admin (email admin@local) may create orgs; simple check
    const isGlobalAdmin = user?.email === (process.env.SEED_ADMIN_EMAIL ?? 'admin@local');
    if (!isGlobalAdmin) throw new Error('Only global admin can create orgs');
    return this.orgs.createOrg(body.name, user);
  }

  @Get()
  async myOrgs(@CurrentUser() user) {
    return this.orgs.findAllForUser(user.userId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.orgs.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string }, @CurrentUser() user) {
    // only global admin in this simple implementation:
    const isGlobalAdmin = user?.email === (process.env.SEED_ADMIN_EMAIL ?? 'admin@local');
    if (!isGlobalAdmin) throw new Error('Only global admin can update orgs');
    return this.orgs.updateOrg(id, body.name);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user) {
    const isGlobalAdmin = user?.email === (process.env.SEED_ADMIN_EMAIL ?? 'admin@local');
    if (!isGlobalAdmin) throw new Error('Only global admin can delete orgs');
    return this.orgs.removeOrg(id);
  }
}
