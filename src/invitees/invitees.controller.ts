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
import { ExportFilterDto } from './DTOs/export-filter.dto';
import { MarkAttendanceByDayDto } from './DTOs/mark-attendance.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { InviteesIntrospectionService } from './invitees-introspection.service';
import { InviteesExportService } from './invitees-export.service';

@Controller('invitees')
export class InviteesController {
  constructor(
    private readonly inviteesService: InviteesService,
    private readonly introspectionService: InviteesIntrospectionService,
    private readonly exportService: InviteesExportService,
  ) {}

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

  /**
   * Marca asistencia para un día específico (sistema dinámico)
   * @param id - ID del invitado
   * @param data - { dayNumber: number, attended: boolean, notes?: string }
   */
  @Patch(':id/attendance/day')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  markAttendanceByDay(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: MarkAttendanceByDayDto,
  ) {
    return this.inviteesService.markAttendanceByDay(id, data);
  }

  /**
   * Obtiene información completa del combo asociado a un invitado
   * Maneja múltiples rutas de acceso y casos edge
   */
  @Get(':id/combo-info')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  getComboInfo(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inviteesService.getComboInfoForInvitee(id);
  }

  /**
   * Obtiene el esquema de campos de metadata descubiertos dinámicamente
   */
  @Get('schema/metadata')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  getMetadataSchema(@Query('eventId') eventId?: string) {
    return this.introspectionService.discoverMetadataFields(eventId);
  }

  /**
   * Obtiene los tipos de merchandising descubiertos dinámicamente de los combos
   */
  @Get('schema/merchandise')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  getMerchandiseSchema(@Query('eventId', new ParseUUIDPipe()) eventId: string) {
    return this.introspectionService.discoverMerchandiseTypes(eventId);
  }

  /**
   * Prepara el esquema de exportación (preview de columnas)
   */
  @Post('export/prepare')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  async prepareExport(@Body() filter: ExportFilterDto) {
    return this.exportService.buildExportSchema(filter);
  }

  /**
   * Genera los datos completos de exportación
   */
  @Post('export/generate')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  async generateExport(@Body() filter: ExportFilterDto) {
    return this.exportService.generateExportData(filter);
  }

  /**
   * Endpoint público para obtener invitados por paymentId
   * Usado en sitio estático para descarga de entradas con QR
   */
  @Get('public/by-payment/:paymentId')
  findByPaymentIdPublic(@Param('paymentId', new ParseUUIDPipe()) paymentId: string) {
    return this.inviteesService.findByPaymentId(paymentId);
  }
}