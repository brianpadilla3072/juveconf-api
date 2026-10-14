/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateTeamDto, CreateTeamTypeDto, EventQueryDto, TeamsQueryDto, UpdateTeamDto, UpdateTeamTypeDto } from './dto/teams.dto';
import { TeamsService } from './teams.service';

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN];

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // ---- publico ----

  @Get('public/types')
  publicTypes(@Query() query: EventQueryDto) {
    return this.teamsService.listPublicTypes(query.eventId);
  }

  @Post('public')
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(dto);
  }

  @Get('public/:id')
  getOne(@Param('id', new ParseUUIDPipe()) id: string, @Query('token', new ParseUUIDPipe()) token: string) {
    return this.teamsService.getByToken(id, token);
  }

  @Put('public/:id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('token', new ParseUUIDPipe()) token: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.updateByToken(id, token, dto);
  }

  // ---- administracion ----

  @Get('admin/types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  adminTypes(@Query() query: EventQueryDto) {
    return this.teamsService.adminListTypes(query.eventId);
  }

  @Post('admin/types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  createType(@Body() dto: CreateTeamTypeDto) {
    return this.teamsService.createType(dto);
  }

  @Patch('admin/types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  updateType(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateTeamTypeDto) {
    return this.teamsService.updateType(id, dto);
  }

  @Delete('admin/types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  removeType(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.teamsService.removeType(id);
  }

  @Get('admin/teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  adminTeams(@Query() query: TeamsQueryDto) {
    return this.teamsService.adminListTeams(query.eventId, query.teamTypeId, query.q);
  }

  @Patch('admin/teams/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  adminUpdate(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.adminUpdateTeam(id, dto);
  }

  @Delete('admin/teams/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  adminDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.teamsService.adminDeleteTeam(id);
  }
}
