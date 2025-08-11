/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Patch, Delete, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CombosService } from './combos.service';
import { CreateComboDto } from './DTOs/create-combo.dto';
import { UpdateComboDto } from './DTOs/update-combo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  create(@Body() dto: CreateComboDto) {
    return this.combosService.create(dto);
  }

  @Get()
  findAll() {
    return this.combosService.findAll();
  }

  @Get('statistics')
  getComboStatistics() {
    return this.combosService.getComboStatistics();
  }

  @Get('search')
  searchCombos(@Query('q') query: string) {
    return this.combosService.searchCombos(query);
  }

  @Get('event/:eventId')
  findByEvent(@Param('eventId') eventId: string) {
    return this.combosService.findByEvent(eventId);
  }

  @Get('year/:year')
  findByYear(@Param('year', ParseIntPipe) year: number) {
    return this.combosService.findByYear(year);
  }

  @Get('price-range')
  findByPriceRange(
    @Query('min', ParseIntPipe) minPrice: number,
    @Query('max', ParseIntPipe) maxPrice: number,
  ) {
    return this.combosService.findByPriceRange(minPrice, maxPrice);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.combosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateComboDto) {
    return this.combosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.combosService.remove(id);
  }
}
