/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { InviteesService } from './invitees.service';
import { InviteesController } from './invitees.controller';
import { InviteesIntrospectionService } from './invitees-introspection.service';
import { InviteesExportService } from './invitees-export.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [InviteesController],
  providers: [
    InviteesService,
    InviteesIntrospectionService,
    InviteesExportService,
    PrismaService,
  ],
})
export class InviteesModule {}