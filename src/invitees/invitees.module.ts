/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { InviteesService } from './invitees.service';
import { InviteesController } from './invitees.controller';

@Module({
  controllers: [InviteesController],
  providers: [InviteesService],
})
export class InviteesModule {}