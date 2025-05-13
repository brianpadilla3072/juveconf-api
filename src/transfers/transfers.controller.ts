/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { TransfersService } from './transfers.service';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get('pending')
  async getPendingTransfers(
    @Query('begin') begin: string,
    @Query('end') end: string,
    @Query('cuil') cuil: string,
  ) {
    return this.transfersService.getPendingTransfers(begin, end, cuil);
  }
}
