/* eslint-disable prettier/prettier */
import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  ParseUUIDPipe, 
  Query, 
  Patch, 
  Post, 
  Delete,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { InviteesService } from './invitees.service';
import { FilterInviteesDto, CreateInviteeDto, UpdateInviteeDto } from './DTOs';
import { MarkAttendanceDto } from './DTOs/mark-attendance.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('invitees')
export class InviteesController {
  constructor(private readonly inviteesService: InviteesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  findAll(@Query() filter: FilterInviteesDto) {
    return this.inviteesService.findAll(filter);
  }

  @Get('emails/list')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  getInviteesEmails(@Query() filter: FilterInviteesDto) {
    return this.inviteesService.getInviteesEmails(filter);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  create(@Body() createInviteeDto: CreateInviteeDto) {
    return this.inviteesService.create(createInviteeDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inviteesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  update(
    @Param('id', new ParseUUIDPipe()) id: string, 
    @Body() updateInviteeDto: UpdateInviteeDto
  ) {
    return this.inviteesService.update(id, updateInviteeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inviteesService.remove(id);
  }

  @Patch(':id/attendance')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  markAttendance(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: MarkAttendanceDto,
  ) {
    return this.inviteesService.markAttendance(id, data);
  }
}