/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PresalesService } from './presales.service';
import { CreatePreSaleDto } from './DTOs/create-presale.dto';
import { UpdatePreSaleDto } from './DTOs/update-presale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('presales')
export class PresalesController {
  constructor(private readonly presalesService: PresalesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  create(@Body() createPreSaleDto: CreatePreSaleDto) {
    return this.presalesService.create(createPreSaleDto);
  }

  @Get()
  findAll() {
    return this.presalesService.findAll();
  }

  @Get('active')
  findActive() {
    return this.presalesService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presalesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() updatePreSaleDto: UpdatePreSaleDto) {
    return this.presalesService.update(id, updatePreSaleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.presalesService.remove(id);
  }
}
