/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { InviteesService } from './invitees.service';
import { InviteesController } from './invitees.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [InviteesController],
  providers: [InviteesService, PrismaService],
})
export class InviteesModule {}