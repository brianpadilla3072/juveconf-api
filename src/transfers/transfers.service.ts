/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { PaymentType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CustomError } from 'src/global/CustomError';
import { JwtService } from 'src/jwt/jwt.service';
import { AttendeeDto, CreatePreferenceDto } from 'src/mercadopago/DTOs/create-preference.dto';
import { MercadopagoService } from 'src/mercadopago/mercadopago.service';
import { OrdersService, OrderStatus } from 'src/orders/orders.service';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly mpService: MercadopagoService,
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,

  ) { }


  // trae todas las transferencias apobadas echas a mi en un periodo de tiempo
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
  // crea una orden para las transferencias 
  async createTransferOrder(dto: CreatePreferenceDto): Promise<{ success: true }> {
    console.log('[createTransferOrder] Inicio con DTO:', dto);

    // 1) Obtener combo
    const combo = await this.prisma.combo.findUnique({ where: { id: dto.id } });
    if (!combo) {
      console.warn('[createTransferOrder] Combo no encontrado:', dto.id);
      throw new CustomError(404, 'Combo no encontrado', 'No pudimos encontrar el combo solicitado.');
    }
    console.log('[createTransferOrder] Combo encontrado:', combo);

    const payloadForCheck = { comboId: dto.id, email: dto.email, cuil: dto.cuil };
    console.log('[createTransferOrder] Payload para validación:', payloadForCheck);

    // 2) Validar órdenes pendientes por transferencia
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        paymentType: PaymentType.TRANSFER,
        eventId: dto.eventId,
      },
    });
    console.log(`[createTransferOrder] Órdenes pendientes encontradas: ${pendingOrders.length}`);

    for (const order of pendingOrders) {
      if (!order.metadataToken) {
        console.log(`[createTransferOrder] Orden ${order.id} sin metadataToken, se omite.`);
        continue;
      }
      let existing: Record<string, any> | null;
      try {
        existing = this.jwtService.verifyMetadata(order.metadataToken);
        console.log(`[createTransferOrder] Metadata verificada para orden ${order.id}:`, existing);
      } catch (err) {
        console.warn(`[createTransferOrder] Error al verificar metadata para orden ${order.id}, se omite.`, err);
        continue;
      }

      if (
        existing?.comboId === payloadForCheck.comboId &&
        existing?.email === payloadForCheck.email &&
        existing?.cuil === payloadForCheck.cuil
      ) {
        console.warn('[createTransferOrder] Orden pendiente existente detectada, se aborta.');
        throw new CustomError(
          400,
          'Orden pendiente existente',
          'Ya existe una orden pendiente para este combo con este email y CUIL.'
        );
      }
    }

    // 3) Crear orden dentro de transacción
    try {
      await this.prisma.$transaction(async (tx) => {
        const totalAmount = combo.price * combo.minPersons;
        console.log('[createTransferOrder] Total calculado:', totalAmount);

        const order = await tx.order.create({
          data: {
            year: new Date().getFullYear(),
            userId: dto.userId,
            eventId: dto.eventId,
            total: totalAmount,
            status: OrderStatus.PENDING,
            paymentType: PaymentType.TRANSFER,
            combos: { connect: [{ id: combo.id }] },
          },
        });
        console.log('[createTransferOrder] Orden creada:', order.id);

        const metadataPayload = {
          orderId: order.id,
          userId: dto.userId || null,
          eventId: dto.eventId,
          comboId: combo.id,
          quantity: dto.quantity,
          email: dto.email,
          cuil: dto.cuil,
          totalAmount,
          currency: 'ARS',
          attendees: dto.attendees,
        };

        const metadataToken = this.jwtService.signMetadata(metadataPayload);
        console.log('[createTransferOrder] Metadata token generado.');

        await tx.order.update({
          where: { id: order.id },
          data: { metadataToken },
        });
        console.log('[createTransferOrder] Orden actualizada con metadata.');
      });
    } catch (error) {
      console.error('[createTransferOrder] Error al crear orden:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(500, 'Error inesperado', 'Hubo un error al crear la orden de transferencia.');
    }
    // 4) Enviar confirmacion
    
    console.log('[createTransferOrder] Orden de transferencia creada con éxito.');
    return { success: true };
  }

  // verifica la transferencia para una cuenta de mp con numero de operacion
  async verifyTransferDeMercadoPago(paymentId: number, orderId: string) {
    const payment = await this.mpService.getPaymentById(paymentId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, paymentType: 'TRANSFER' },
    });

    // Validación de metadata
    const token = order?.metadataToken;
    if (!token) {
      this.logger.error('No se encontró token en metadata del pago.');
      return 'ERROR';
    }

    let payload: any;
    try {
      payload = this.jwtService.verifyMetadata(token);
      if (!payload) throw new Error('JWT inválido o expirado.');
    } catch (err) {
      this.logger.error(`Error al verificar el JWT: ${err.message}`);
      return 'ERROR';
    }

    if (
      payment.transaction_amount !== payload.totalAmount ||
      payment.currency_id !== payload.currency
    ) {
      this.logger.error(`Monto o moneda no coinciden`);
      return 'ERROR';
    }

    const newStatus: OrderStatus = (() => {
      switch (payment.status) {
        case 'approved': return OrderStatus.APPROVED;
        case 'pending': return OrderStatus.PENDING;
        case 'rejected': return OrderStatus.REJECTED;
        default:
          this.logger.warn(`Estado de pago no manejado: ${payment.status}`);
          return OrderStatus.PENDING;
      }
    })();

    // Transacción completa
    return await this.prisma.$transaction(async (tx) => {
      // 1. Actualizar estado de orden
      await tx.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });

      // 2. Registrar pago
      const paymentNew = await tx.payment.create({
        data: {
          year: new Date().getFullYear(),
          orderId: order.id,
          amount: payment.transaction_amount,
          type: PaymentType.MERCADOPAGO,
          externalReference: String(payment.id),
          userId: payload.userId,
          payerEmail: payment.payer?.email || payload.metadata?.email,
          payerName: ` ${payment.payer?.first_name} ${payment.payer?.last_name} -${payment.payer?.email} - phone ${payment.payer?.phone.number} - ${payment.payer?.identification.number} ${payment.payer?.identification.type}`,
          payerDni: String(payment.payer?.identification.number || payload.metadata?.cuil),
        },
      });

      // 3. Crear asistentes
      const decoded: any = this.jwtService.decodeMetadata(String(order.metadataToken));

      function isAttendeeDto(obj: any): obj is AttendeeDto {
        return (
          obj &&
          typeof obj === 'object' &&
          typeof obj.name === 'string' &&
          typeof obj.cuil === 'string'
        );
      }

      function isAttendeeDtoArray(arr: any): arr is AttendeeDto[] {
        return Array.isArray(arr) && arr.every(isAttendeeDto);
      }

      if (!decoded || !('attendees' in decoded) || !isAttendeeDtoArray(decoded.attendees)) {
        this.logger.error('Formato inválido de asistentes en metadataToken.');
        throw new Error('Invalid attendee format');
      }

      for (const attendee of decoded.attendees) {
        await tx.invitee.create({
          data: {
            name: attendee.name,
            cuil: attendee.cuil,
            orderId: order.id,
            paymentId: paymentNew.id,
          },
        });
      }

      return 'OK';
    }).catch((err) => {
      this.logger.error(`Error en verificación de transferencia: ${err.message}`);
      return 'ERROR';
    });
  }
  async verifyTransferDeOtrasPlataformas(paymentId: string, orderId: string) {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 20);

    // Formatear fechas en formato ISO (o el requerido por la API de MP)
    const begin = pastDate.toISOString(); // fecha 20 días atrás
    const end = today.toISOString();      // fecha actual
    const trans = await this.mpService.getPaymentsByDateRange(begin, end);
    const countId = await this.mpService.getCollectorId()

    // return payment
    const transaction = trans.results
      .filter(transaccion => {
        const transaction_id = transaccion.transaction_details?.transaction_id;

        const esTransferencia = ['bank_transfer', 'account_money'].includes(transaccion.payment_type_id);
        const esAprobado = transaccion.status === 'approved';
        const coincideDestino = transaccion.collector_id === countId;
        const coincideId = String(paymentId) === String(transaction_id);
        return esTransferencia && esAprobado && coincideDestino && coincideId;
      });

    if (transaction.length === 0) {
      console.warn('⚠️ No se encontró ninguna transacción que coincida con los criterios.');
    }
    const payment = transaction[0]



    const order = await this.prisma.order.findFirst({
      where: { id: orderId, paymentType: 'TRANSFER' },
    });

    // Validación de metadata
    const token = order?.metadataToken;
    if (!token) {
      this.logger.error('No se encontró token en metadata del pago.');
      return 'ERROR';
    }

    let payload: any;
    try {
      payload = this.jwtService.verifyMetadata(token);
      if (!payload) throw new Error('JWT inválido o expirado.');
    } catch (err) {
      this.logger.error(`Error al verificar el JWT: ${err.message}`);
      return 'ERROR';
    }

    if (
      payment.transaction_amount !== payload.totalAmount ||
      payment.currency_id !== payload.currency
    ) {
      this.logger.error(`Monto o moneda no coinciden`);
      return 'ERROR';
    }

    const newStatus: OrderStatus = (() => {
      switch (payment.status) {
        case 'approved': return OrderStatus.APPROVED;
        case 'pending': return OrderStatus.PENDING;
        case 'rejected': return OrderStatus.REJECTED;
        default:
          this.logger.warn(`Estado de pago no manejado: ${payment.status}`);
          return OrderStatus.PENDING;
      }
    })();

    // Transacción completa
    return await this.prisma.$transaction(async (tx) => {
      // 1. Actualizar estado de orden
      await tx.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });

      // 2. Registrar pago
      const paymentNew = await tx.payment.create({
        data: {
          year: new Date().getFullYear(),
          orderId: order.id,
          amount: payment.transaction_amount,
          type: PaymentType.MERCADOPAGO,
          externalReference: String(payment.id),
          userId: payload.userId,
          payerEmail: payment.payer?.email || payload.metadata?.email,
          payerName: ` ${payment.payer?.first_name} ${payment.payer?.last_name} -${payment.payer?.email} - phone ${payment.payer?.phone.number} - ${payment.payer?.identification.number} ${payment.payer?.identification.type}`,
          payerDni: String(payment.payer?.identification.number || payload.metadata?.cuil),
        },
      });

      // 3. Crear asistentes
      const decoded: any = this.jwtService.decodeMetadata(String(order.metadataToken));

      function isAttendeeDto(obj: any): obj is AttendeeDto {
        return (
          obj &&
          typeof obj === 'object' &&
          typeof obj.name === 'string' &&
          typeof obj.cuil === 'string'
        );
      }

      function isAttendeeDtoArray(arr: any): arr is AttendeeDto[] {
        return Array.isArray(arr) && arr.every(isAttendeeDto);
      }

      if (!decoded || !('attendees' in decoded) || !isAttendeeDtoArray(decoded.attendees)) {
        this.logger.error('Formato inválido de asistentes en metadataToken.');
        throw new Error('Invalid attendee format');
      }

      for (const attendee of decoded.attendees) {
        await tx.invitee.create({
          data: {
            name: attendee.name,
            cuil: attendee.cuil,
            orderId: order.id,
            paymentId: paymentNew.id,
          },
        });
      }

      return 'OK';
    }).catch((err) => {
      this.logger.error(`Error en verificación de transferencia: ${err.message}`);
      return 'ERROR';
    });
  }





}