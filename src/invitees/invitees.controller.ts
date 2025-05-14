/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, ParseUUIDPipe, Query, Patch } from '@nestjs/common';
import { InviteesService } from './invitees.service';
import { FilterInviteesDto } from './DTOs';
import { MarkAttendanceDto } from './DTOs/mark-attendance.dto';

@Controller('invitees')
export class InviteesController {
  constructor(private readonly inviteesService: InviteesService) {}

  @Get()
  findAll(@Query() filter: FilterInviteesDto) {
    return this.inviteesService.findAll(filter);
  }
    @Patch(':id/attendance')
  async markAttendance(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: MarkAttendanceDto,
  ) {
    return this.inviteesService.markAttendance(id, data);
  }

}