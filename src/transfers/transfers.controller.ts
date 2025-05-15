/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { TransfersService } from './transfers.service';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) { }

  @Get('approved')
  getApprovedTransfers(
    @Query('begin') begin: string,
    @Query('end') end: string,
    @Query('cuil') cuil: string,
  ) {
    return this.transfersService.getApprovedTransfers(begin, end, cuil);
  }
  @Get('payment/:id')
getPaymentById(
  @Param('id') id: string,
) {
  return this.transfersService.getPaymentInMercadoPago(id);
}

}

