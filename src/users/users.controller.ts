/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import UsersService from './users.service';
import { CreateUserDto } from './DTOs/CreateUserDto';
import { UpdateUserDto } from './DTOs/UpdateUserDto';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';

@Controller('users')
export class UsersController {

  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  async findAll() {
    return this.usersService.findAllUsers();
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
  async findById(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  async delete(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}


