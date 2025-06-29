import { Module } from '@nestjs/common';
import UsersService from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersController } from './users.controller';
import { PasswordService } from 'src/global/password.service';

@Module({
  providers: [UsersService, PrismaService, PasswordService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
