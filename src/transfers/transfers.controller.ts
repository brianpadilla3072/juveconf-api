/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreatePreferenceDto } from 'src/mercadopago/DTOs/create-preference.dto';

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

  @Get('verifyTransferMercadoPago')
  verifyTransfer( 
    @Body('orderId') orderId : string,
    @Body('paymentId') paymentId :number) {
      return this.transfersService.verifyTransferDeMercadoPago( paymentId, orderId)
  }
  @Get('verifyTransferDeOtrasPlataformas')
  verifyTransferDeOtrasPlataformas( 
    @Body('orderId') orderId : string,
    @Body('paymentId') paymentId :string) {
      return this.transfersService.verifyTransferDeOtrasPlataformas( paymentId, orderId)
  }
   @Post('create-transfer-order')
  @HttpCode(HttpStatus.CREATED)
  async createTransferOrder(
    @Body() dto: CreatePreferenceDto,
  ){
    return this.transfersService.createTransferOrder(dto);
  }
}

