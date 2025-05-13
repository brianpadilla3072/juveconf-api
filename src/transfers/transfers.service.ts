/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { MercadopagoService } from 'src/mercadopago/mercadopago.service';
import { JwtService } from 'src/jwt/jwt.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly mpService: MercadopagoService,
    private readonly jwtService: JwtService,
    private readonly ordersService: OrdersService,
  ) {}

  private includesCuil(token: string, cuil: string): boolean {
    try {
      const decoded = this.jwtService.verifyMetadata(token);
      return decoded?.cuil === cuil;
    } catch (err) {
      this.logger.warn(`[includesCuil] Error verificando token: ${err.message}`);
      return false;
    }
  }

 async getPendingTransfers(begin: string, end: string, cuil: string) {
  this.logger.log(`[TransfersService] Buscando pagos entre ${begin} y ${end} para CUIL: ${cuil}`);

  const data = await this.mpService.getPaymentsBetweenDates(begin, end);
  const orders = await this.ordersService.getOrdersByCuil(cuil);

  this.logger.log(`[TransfersService] Total de pagos obtenidos: ${data.results?.length}`);

  const transfers = data.results
    .map((payment) => {
      const token = payment.metadata?.token || '';
      const decoded = this.includesCuil(token, cuil) ? this.jwtService.verifyMetadata(token) : null;
      return decoded ? { ...payment, decodedMetadata: decoded } : null;
    })
    .filter(Boolean);

  this.logger.log(`[TransfersService] Total de transferencias filtradas: ${transfers.length}`);

  const arrorders = Array.isArray(orders)
    ? orders
        .map((order) => {
          const token = order.metadataToken || '';
          const decoded = this.includesCuil(token, cuil) ? this.jwtService.verifyMetadata(token) : null;
          return decoded ? { ...order, decodedMetadata: decoded } : null;
        })
        .filter(Boolean)
    : [];

  this.logger.log(`[TransfersService] Total de órdenes filtradas: ${arrorders.length}`);

  return {
    orders: arrorders,
    transfers: transfers,
  };
}


}
//http://localhost:3072/transfers/pending?begin=2025-05-01T00:00:00Z&end=2025-05-11T23:59:59Z&cuil=20424695794