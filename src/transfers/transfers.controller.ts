/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreatePreferenceDto } from 'src/mercadopago/DTOs/create-preference.dto';
import { OrdersService } from 'src/orders/orders.service';
import { ApproveOrderDto } from './DTOs/approveOrder.dto';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService
    ,private readonly ordersService: OrdersService
  ) { }

  // @Get('approved')
  // getApprovedTransfers(
  //   @Query('begin') begin: string,
  //   @Query('end') end: string,
  //   @Query('cuil') cuil: string,
  // ) {
  //   return this.transfersService.getApprovedTransfers(begin, end, cuil);
  // }

  // @Get('verifyTransferMercadoPago')
  // verifyTransfer( 
  //   @Body('orderId') orderId : string,
  //   @Body('paymentId') paymentId :number) {
  //     return this.transfersService.verifyTransferDeMercadoPago( paymentId, orderId)
  // }
  // @Get('verifyTransferDeOtrasPlataformas')
  // verifyTransferDeOtrasPlataformas( 
  //   @Body('orderId') orderId : string,
  //   @Body('paymentId') paymentId :string) {
  //     return this.transfersService.verifyTransferDeOtrasPlataformas( paymentId, orderId)
  // }
  @Post('create-transfer-order')
  @HttpCode(HttpStatus.CREATED)
  async createTransferOrder(
    @Body() dto: CreatePreferenceDto,
  ){
    return this.transfersService.createTransferOrder(dto);
  }
  @Post('approve-order')
  @HttpCode(HttpStatus.OK)
  async approveOrder(
    @Body() dto: ApproveOrderDto) {
    console.log(dto);
    return this.ordersService.moveToReview(dto.orderId,dto.email,dto.cuil);
  }

  @Post('create-cash-order')
  @HttpCode(HttpStatus.CREATED)
  async createCashOrder(
    @Body() dto: CreatePreferenceDto,
  ) {
    return this.transfersService.createCashOrder(dto);
  }
}

