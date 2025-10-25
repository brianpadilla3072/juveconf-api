/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PresalesService } from './presales.service';
import { PresalesController } from './presales.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PresalesController],
  providers: [PresalesService, PrismaService],
  exports: [PresalesService],
})
export class PresalesModule {}
