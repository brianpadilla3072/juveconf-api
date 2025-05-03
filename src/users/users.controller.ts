/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './DTOs/CreateUserDto';

@Controller('users')
export class UsersController {

  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAllUsers();
  }
  @Get(':id')
  async findById(@Param('id') id: number) {
    return this.usersService.getUser(id);
  }
}


