/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import UsersService from './users.service';
import { CreateUserDto } from './DTOs/CreateUserDto';
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
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  async findAll() {
    return this.usersService.findAllUsers();
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  async findById(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }
}


