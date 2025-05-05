/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { InviteesService } from './invitees.service';
import { FilterInviteesDto } from './DTOs';

@Controller('invitees')
export class InviteesController {
  constructor(private readonly inviteesService: InviteesService) {}

  @Get()
  findAll(@Query() filter: FilterInviteesDto) {
    return this.inviteesService.findAll(filter);
  }
}