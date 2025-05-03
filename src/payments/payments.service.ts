/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MercadoPagoConfig,
  Preference,
  Payment,
} from 'mercadopago';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // Configuración del SDK v2.x
  private mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });

  // Clientes tipados
  private preferenceClient = new Preference(this.mpConfig);
  private paymentClient    = new Payment(this.mpConfig);

  constructor(private prisma: PrismaService) {}

  /** Crea una preferencia de pago y devuelve el init_point (URL) */
  async createPreference(orderId: number): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { combos: true, asistentes: true },
    });
    if (!order) throw new Error('Order not found');
  
    const body = {
      items: order.combos.map(c => ({
        id: String(c.id),          // ← campo obligatorio
        title: c.name,
        quantity: 1,
        unit_price: c.price,
        currency_id: 'ARS',
      })),
      external_reference: String(order.id),
      back_urls: {
        success: process.env.MP_SUCCESS_URL!,
        failure: process.env.MP_FAILURE_URL!,
        pending: process.env.MP_PENDING_URL!,
      },
      notification_url: process.env.MP_WEBHOOK_URL!,
      auto_return: 'approved',
      payer: {
        name: order.asistentes[0]?.name || '',
        email: order.asistentes[0]?.email || '',
      },
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }],
        installments: 1,
      },
      metadata: { orderId: order.id },
    };
  
    const response = await this.preferenceClient.create({ body });
    // Ahora el init_point está directamente en response.init_point
    const initPoint: string = response.init_point!;
    this.logger.log(`Preferencia creada para order ${orderId}: ${initPoint}`);
    return initPoint;
  }
  

  /** Maneja el webhook de Mercado Pago para actualizar el estado de la orden */
  async handleWebhook(payload: any): Promise<void> {
    const paymentId = payload?.data?.id;
    if (!paymentId) {
      this.logger.warn('Webhook recibido sin paymentId');
      return;
    }

    try {
      // Obtener datos del pago
      const paymentData = await this.paymentClient.get({ id: paymentId });
      const status       = paymentData.status;
      const extRef       = paymentData.external_reference;

      this.logger.log(`Webhook: Pago ${paymentId} -> estado ${status}, orden ${extRef}`);

      const orderId = Number(extRef);
      if (isNaN(orderId)) {
        this.logger.warn(`external_reference inválido: ${extRef}`);
        return;
      }

      // Actualizar la orden en la base de datos
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status },
      });
      this.logger.log(`Order ${orderId} actualizada a estado ${status}`);
    } catch (err: any) {
      this.logger.error(`Error procesando webhook: ${err.message}`);
    }
  }
}
