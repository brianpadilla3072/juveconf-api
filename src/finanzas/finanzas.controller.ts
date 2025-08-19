import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { FinanzasService } from './finanzas.service';
import { CreateIngresoDto, UpdateIngresoDto, CreateEgresoDto, UpdateEgresoDto } from './DTOs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('finanzas')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
export class FinanzasController {
  constructor(private readonly finanzasService: FinanzasService) {}

  // Ingresos endpoints
  @Post('ingresos')
  createIngreso(@Body() createIngresoDto: CreateIngresoDto) {
    return this.finanzasService.createIngreso(createIngresoDto);
  }

  @Get('ingresos')
  findAllIngresos(@Query('year') year?: string) {
    const yearNumber = year ? parseInt(year) : undefined;
    return this.finanzasService.findAllIngresos(yearNumber);
  }

  @Get('ingresos/:id')
  findOneIngreso(@Param('id') id: string) {
    return this.finanzasService.findOneIngreso(id);
  }

  @Put('ingresos/:id')
  updateIngreso(@Param('id') id: string, @Body() updateIngresoDto: UpdateIngresoDto) {
    return this.finanzasService.updateIngreso(id, updateIngresoDto);
  }

  @Delete('ingresos/:id')
  removeIngreso(@Param('id') id: string) {
    return this.finanzasService.removeIngreso(id);
  }

  // Egresos endpoints
  @Post('egresos')
  createEgreso(@Body() createEgresoDto: CreateEgresoDto) {
    return this.finanzasService.createEgreso(createEgresoDto);
  }

  @Get('egresos')
  findAllEgresos(@Query('year') year?: string) {
    const yearNumber = year ? parseInt(year) : undefined;
    return this.finanzasService.findAllEgresos(yearNumber);
  }

  @Get('egresos/:id')
  findOneEgreso(@Param('id') id: string) {
    return this.finanzasService.findOneEgreso(id);
  }

  @Put('egresos/:id')
  updateEgreso(@Param('id') id: string, @Body() updateEgresoDto: UpdateEgresoDto) {
    return this.finanzasService.updateEgreso(id, updateEgresoDto);
  }

  @Delete('egresos/:id')
  removeEgreso(@Param('id') id: string) {
    return this.finanzasService.removeEgreso(id);
  }

  // Balance y dashboard
  @Get('balance')
  getBalance(@Query('year') year?: string) {
    const yearNumber = year ? parseInt(year) : undefined;
    return this.finanzasService.getBalance(yearNumber);
  }

  @Get('dashboard')
  getDashboardStats(@Query('year') year?: string) {
    const yearNumber = year ? parseInt(year) : undefined;
    return this.finanzasService.getDashboardStats(yearNumber);
  }
}