/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { MercadopagoService } from 'src/mercadopago/mercadopago.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly mpService: MercadopagoService,
    private readonly ordersService: OrdersService,
  ) {}

 

 async getApprovedTransfers(begin: string, end: string, cuil: string) {

  this.logger.log(
    `[TransfersService] Buscando aprobadas entre ${begin} y ${end} para CUIL: ${cuil}`
  );
  const collectoid = await this.mpService.getCollectorId()
  const data = await this.mpService.getPaymentsByDateRange(begin, end);
  const orders = await this.ordersService.getOrdersByCuil(cuil);
  const transferenciasEntrantesReales = data.results.filter(t =>
  t.operation_type === "money_transfer" &&
  t.collector_id === collectoid &&
  t.status === 'approved');
  return { orders: orders, transfers: transferenciasEntrantesReales };
  //http://localhost:3072/transfers/approved?begin=2025-04-05T00:00:00.000Z&end=2025-04-07T23:59:59.000Z&cuil=27948995854
}
async getPaymentInMercadoPago(id:string){
  return await this.mpService.getPaymentById(id)
  //http://localhost:3072/transfers/payment/107129823165
}



}