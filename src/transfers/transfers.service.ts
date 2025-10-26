/* eslint-disable prettier/prettier */
 
 
 
 
import { Injectable, Logger } from '@nestjs/common';
import { Order, PaymentType, EmailType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CustomError } from 'src/global/CustomError';
import { JwtService } from 'src/jwt/jwt.service';
import { CreatePreferenceDto } from 'src/mercadopago/DTOs/create-preference.dto';
import { MercadopagoService } from 'src/mercadopago/mercadopago.service';
import { OrdersService, OrderStatus } from 'src/orders/orders.service';
import { MailService } from 'src/mail/mail.service';
import { CombosService } from 'src/combos/combos.service';
import { APP_CONFIG, COLORS } from 'src/constants/app.constants';
import { EmailQueueService } from 'src/email-queue/email-queue.service';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly mpService: MercadopagoService,
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly combosService: CombosService,
    private readonly emailQueueService: EmailQueueService
  ) { }


  // // trae todas las transferencias apobadas echas a mi en un periodo de tiempo
  // async getApprovedTransfers(begin: string, end: string, cuil: string) {

  //   this.logger.log(
  //     `[TransfersService] Buscando aprobadas entre ${begin} y ${end} para CUIL: ${cuil}`
  //   );
  //   const collectoid = await this.mpService.getCollectorId()
  //   const data = await this.mpService.getPaymentsByDateRange(begin, end);
  //   const orders = await this.ordersService.getOrdersByCuil(cuil);
  //   const transferenciasEntrantesReales = data.results.filter(t =>
  //     t.operation_type === "money_transfer" &&
  //     t.collector_id === collectoid &&
  //     t.status === 'approved');
  //   return { orders: orders, transfers: transferenciasEntrantesReales };
  //   //http://localhost:3072/transfers/approved?begin=2025-04-05T00:00:00.000Z&end=2025-04-07T23:59:59.000Z&cuil=27948995854
  // }
  // crea una orden para las transferencias 
  async createTransferOrder(dto: CreatePreferenceDto): Promise<{ success: true,orderID: string | null }> {
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
    let email:string ="";
    let createdOrder: Order | null = null;    // 3) Crear orden dentro de transacción
    try {
      await this.prisma.$transaction(async (tx) => {
        // Get current price with presales
        const currentPrice = await this.combosService.getCurrentPrice(combo.id);
        const totalAmount = currentPrice.price * dto.quantity;
        console.log('[createTransferOrder] Total calculado:', totalAmount);

        // Create order snapshot
        const orderSnapshot = {
          combo: {
            id: combo.id,
            name: combo.name,
            basePrice: combo.price,
            appliedPrice: currentPrice.price,
            personsIncluded: combo.personsIncluded,
            description: combo.description,
          },
          preSale: currentPrice.isPreSale ? {
            id: currentPrice.preSaleId,
            name: currentPrice.preSaleName,
            discount: currentPrice.discount,
          } : null,
          timestamp: new Date().toISOString(),
          quantity: dto.quantity,
        };

        const order = await tx.order.create({
          data: {
            year: new Date().getFullYear(),
            userId: dto.userId,
            eventId: dto.eventId,
            total: totalAmount,
            status: OrderStatus.REVIEW,
            email: dto.email,
            cuil: dto.cuil,
            phone: dto.phone,
            paymentType: PaymentType.TRANSFER,
            comboId: combo.id, // Relación directa one-to-one
            orderSnapshot, // Save snapshot
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
          phone: dto.phone,
          cuil: dto.cuil,
          totalAmount,
          currency: 'ARS',
          attendees: dto.attendees,
        };
        email = metadataPayload.email

        const metadataToken = this.jwtService.signMetadata(metadataPayload);
        console.log('[createTransferOrder] Metadata token generado.');

        await tx.order.update({
          where: { id: order.id },
          data: { metadataToken },
        });
        createdOrder = order;
        console.log('[createTransferOrder] Orden actualizada con metadata.');
      });
    } catch (error) {
      console.error('[createTransferOrder] Error al crear orden:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(500, 'Error inesperado', 'Hubo un error al crear la orden de transferencia.');
    }
    // 4) Enviar confirmacion usando template de Handlebars
    await this.emailQueueService.enqueueTemplateEmail({
      to: email,
      subject: 'Orden Creada - JUVECONF 2025',
      template: 'order-pending',
      context: {
        userName: email.split('@')[0],
        orderId: createdOrder!.id,
      },
      emailType: EmailType.ORDEN_TRANSFER,
      orderId: createdOrder!.id,
    });

    console.log('[createTransferOrder] Orden de transferencia creada con éxito. Email encolado.');
    return { success: true, orderID: createdOrder!.id };
  }

  // crea una orden para pagos en efectivo
  async createCashOrder(dto: CreatePreferenceDto): Promise<{ success: true, orderID: string | null }> {
    console.log('[createCashOrder] Inicio con DTO:', dto);

    // 1) Obtener combo
    const combo = await this.prisma.combo.findUnique({ where: { id: dto.id } });
    if (!combo) {
      console.warn('[createCashOrder] Combo no encontrado:', dto.id);
      throw new CustomError(404, 'Combo no encontrado', 'No pudimos encontrar el combo solicitado.');
    }
    console.log('[createCashOrder] Combo encontrado:', combo);

    const payloadForCheck = { comboId: dto.id, email: dto.email, cuil: dto.cuil };
    console.log('[createCashOrder] Payload para validación:', payloadForCheck);

    // 2) Validar órdenes en review por efectivo
    const reviewOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.REVIEW,
        paymentType: PaymentType.CASH,
        eventId: dto.eventId,
      },
    });
    console.log(`[createCashOrder] Órdenes en review encontradas: ${reviewOrders.length}`);

    for (const order of reviewOrders) {
      if (!order.metadataToken) {
        console.log(`[createCashOrder] Orden ${order.id} sin metadataToken, se omite.`);
        continue;
      }
      let existing: Record<string, any> | null;
      try {
        existing = this.jwtService.verifyMetadata(order.metadataToken);
        console.log(`[createCashOrder] Metadata verificada para orden ${order.id}:`, existing);
      } catch (err) {
        console.warn(`[createCashOrder] Error al verificar metadata para orden ${order.id}, se omite.`, err);
        continue;
      }

      if (
        existing?.comboId === payloadForCheck.comboId &&
        existing?.email === payloadForCheck.email &&
        existing?.cuil === payloadForCheck.cuil
      ) {
        console.warn('[createCashOrder] Orden en review existente detectada, se aborta.');
        throw new CustomError(
          400,
          'Orden en review existente',
          'Ya existe una orden en review de pago en efectivo para este combo con este email y CUIL.'
        );
      }
    }

    let email: string = "";
    let createdOrder: Order | null = null;
    let verificationLink: string = "";

    // 3) Crear orden dentro de transacción
    try {
      await this.prisma.$transaction(async (tx) => {
        // Get current price with presales
        const currentPrice = await this.combosService.getCurrentPrice(combo.id);
        const totalAmount = currentPrice.price * dto.quantity;
        console.log('[createCashOrder] Total calculado:', totalAmount);

        // Create order snapshot
        const orderSnapshot = {
          combo: {
            id: combo.id,
            name: combo.name,
            basePrice: combo.price,
            appliedPrice: currentPrice.price,
            personsIncluded: combo.personsIncluded,
            description: combo.description,
          },
          preSale: currentPrice.isPreSale ? {
            id: currentPrice.preSaleId,
            name: currentPrice.preSaleName,
            discount: currentPrice.discount,
          } : null,
          timestamp: new Date().toISOString(),
          quantity: dto.quantity,
        };

        const order = await tx.order.create({
          data: {
            year: new Date().getFullYear(),
            userId: dto.userId,
            eventId: dto.eventId,
            total: totalAmount,
            status: OrderStatus.REVIEW,
            email: dto.email,
            cuil: dto.cuil,
            phone: dto.phone,
            paymentType: PaymentType.CASH,
            comboId: combo.id, // Relación directa one-to-one
            orderSnapshot, // Save snapshot
          },
        });
        console.log('[createCashOrder] Orden creada:', order.id);

        const metadataPayload = {
          orderId: order.id,
          userId: dto.userId || null,
          eventId: dto.eventId,
          comboId: combo.id,
          quantity: dto.quantity,
          email: dto.email,
          phone: dto.phone,
          cuil: dto.cuil,
          totalAmount,
          currency: 'ARS',
          attendees: dto.attendees,
        };
        email = metadataPayload.email;
        verificationLink = `${APP_CONFIG.url}/verificar-tranferencia/${order.id}`;

        const metadataToken = this.jwtService.signMetadata(metadataPayload);
        console.log('[createCashOrder] Metadata token generado.');

        await tx.order.update({
          where: { id: order.id },
          data: { metadataToken },
        });
        createdOrder = order;
        console.log('[createCashOrder] Orden actualizada con metadata.');
      });
    } catch (error) {
      console.error('[createCashOrder] Error al crear orden:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(500, 'Error inesperado', 'Hubo un error al crear la orden de pago en efectivo.');
    }

    // 4) Enviar confirmacion usando template de Handlebars
    // Get current price to include in email
    const currentPrice = await this.combosService.getCurrentPrice(combo.id);

    await this.emailQueueService.enqueueTemplateEmail({
      to: email,
      subject: 'Orden Creada - JUVECONF 2025',
      template: 'order-pending',
      context: {
        userName: email.split('@')[0],
        orderId: createdOrder!.id,
        amount: currentPrice.price,
      },
      emailType: EmailType.ORDEN_CASH,
      orderId: createdOrder!.id,
    });

    console.log('[createCashOrder] Orden de pago en efectivo creada con éxito. Email encolado.');

    return {
      success: true,
      orderID: createdOrder!.id
    };
  }

  // Crea una orden de pago en efectivo SIN enviar email (versión simple)
  async createCashOrderSimple(dto: CreatePreferenceDto): Promise<{ success: true, orderID: string | null }> {
    console.log('[createCashOrderSimple] Inicio con DTO:', dto);

    // 1) Obtener combo
    const combo = await this.prisma.combo.findUnique({ where: { id: dto.id } });
    if (!combo) {
      console.warn('[createCashOrderSimple] Combo no encontrado:', dto.id);
      throw new CustomError(404, 'Combo no encontrado', 'No pudimos encontrar el combo solicitado.');
    }
    console.log('[createCashOrderSimple] Combo encontrado:', combo);

    const payloadForCheck = { comboId: dto.id, email: dto.email, cuil: dto.cuil };
    console.log('[createCashOrderSimple] Payload para validación:', payloadForCheck);

    // 2) Validar órdenes en review por efectivo
    const reviewOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.REVIEW,
        paymentType: PaymentType.CASH,
        eventId: dto.eventId,
      },
    });
    console.log(`[createCashOrderSimple] Órdenes en review encontradas: ${reviewOrders.length}`);

    for (const order of reviewOrders) {
      if (!order.metadataToken) {
        console.log(`[createCashOrderSimple] Orden ${order.id} sin metadataToken, se omite.`);
        continue;
      }
      let existing: Record<string, any> | null;
      try {
        existing = this.jwtService.verifyMetadata(order.metadataToken);
        console.log(`[createCashOrderSimple] Metadata verificada para orden ${order.id}:`, existing);
      } catch (err) {
        console.warn(`[createCashOrderSimple] Error al verificar metadata para orden ${order.id}, se omite.`, err);
        continue;
      }

      if (
        existing?.comboId === payloadForCheck.comboId &&
        existing?.email === payloadForCheck.email &&
        existing?.cuil === payloadForCheck.cuil
      ) {
        console.warn('[createCashOrderSimple] Orden en review existente detectada, se aborta.');
        throw new CustomError(
          400,
          'Orden en review existente',
          'Ya existe una orden en review de pago en efectivo para este combo con este email y CUIL.'
        );
      }
    }

    // 3) Crear nueva orden y metadata
    let createdOrder: Order;
    try {
      await this.prisma.$transaction(async (tx) => {
        // Get current price with presales
        const currentPrice = await this.combosService.getCurrentPrice(combo.id);
        const totalAmount = currentPrice.price * dto.quantity;
        console.log('[createCashOrderSimple] Total calculado:', totalAmount);

        // Create order snapshot
        const orderSnapshot = {
          combo: {
            id: combo.id,
            name: combo.name,
            basePrice: combo.price,
            appliedPrice: currentPrice.price,
            personsIncluded: combo.personsIncluded,
            description: combo.description,
          },
          preSale: currentPrice.isPreSale ? {
            id: currentPrice.preSaleId,
            name: currentPrice.preSaleName,
            discount: currentPrice.discount,
          } : null,
          timestamp: new Date().toISOString(),
          quantity: dto.quantity,
        };

        const order = await tx.order.create({
          data: {
            total: totalAmount,
            status: OrderStatus.REVIEW,
            paymentType: PaymentType.CASH,
            year: 2025,
            eventId: dto.eventId,
            comboId: combo.id, // CRITICAL: Added missing comboId
            email: dto.email,
            cuil: dto.cuil,
            phone: dto.phone,
            orderSnapshot, // Save snapshot
          },
        });
        console.log('[createCashOrderSimple] Orden creada:', order.id);

        const metadataPayload = {
          orderId: order.id,
          userId: dto.userId || null,
          eventId: dto.eventId,
          comboId: combo.id,
          quantity: dto.quantity,
          email: dto.email,
          phone: dto.phone,
          cuil: dto.cuil,
          totalAmount,
          currency: 'ARS',
          attendees: dto.attendees,
        };

        const metadataToken = this.jwtService.signMetadata(metadataPayload);
        console.log('[createCashOrderSimple] Metadata token generado.');

        await tx.order.update({
          where: { id: order.id },
          data: { metadataToken },
        });
        createdOrder = order;
        console.log('[createCashOrderSimple] Orden actualizada con metadata.');
      });
    } catch (error) {
      console.error('[createCashOrderSimple] Error al crear orden:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(500, 'Error inesperado', 'Hubo un error al crear la orden de pago en efectivo.');
    }

    console.log('[createCashOrderSimple] Orden de pago en efectivo creada exitosamente (sin email).');
    
    return { 
      success: true, 
      orderID: createdOrder!.id
    };
  }
  
  // verifica la transferencia para una cuenta de mp con numero de operacion
  // async verifyTransferDeMercadoPago(paymentId: number, orderId: string) {
  //   const payment = await this.mpService.getPaymentById(paymentId);
  //   const order = await this.prisma.order.findFirst({
  //     where: { id: orderId, paymentType: 'TRANSFER' },
  //   });

  //   // Validación de metadata
  //   const token = order?.metadataToken;
  //   if (!token) {
  //     this.logger.error('No se encontró token en metadata del pago.');
  //     return 'ERROR';
  //   }

  //   let payload: any;
  //   try {
  //     payload = this.jwtService.verifyMetadata(token);
  //     if (!payload) throw new Error('JWT inválido o expirado.');
  //   } catch (err) {
  //     this.logger.error(`Error al verificar-tranferencia el JWT: ${err.message}`);
  //     return 'ERROR';
  //   }

  //   if (
  //     payment.transaction_amount !== payload.totalAmount ||
  //     payment.currency_id !== payload.currency
  //   ) {
  //     this.logger.error(`Monto o moneda no coinciden`);
  //     return 'ERROR';
  //   }
  //   const newStatus: OrderStatus = OrderStatus.PAID;

  //   // Transacción completa
  //   return await this.prisma.$transaction(async (tx) => {
  //     // 1. Actualizar estado de orden
  //     await tx.order.update({
  //       where: { id: order.id },
  //       data: { status: newStatus },
  //     });

  //     // 2. Registrar pago
  //     const paymentNew = await tx.payment.create({
  //       data: {
  //         year: new Date().getFullYear(),
  //         orderId: order.id,
  //         amount: payment.transaction_amount,
  //         type: PaymentType.MERCADOPAGO,
  //         externalReference: String(payment.id),
  //         userId: payload.userId,
  //         payerEmail: payment.payer?.email || payload.metadata?.email,
  //         payerName: ` ${payment.payer?.first_name} ${payment.payer?.last_name} -${payment.payer?.email} - phone ${payment.payer?.phone.number} - ${payment.payer?.identification.number} ${payment.payer?.identification.type}`,
  //         payerDni: String(payment.payer?.identification.number || payload.metadata?.cuil),
  //         payerPhone: payment.payer?.phone?.number || payload.metadata?.phone,
  //       },
  //     });

  //     // 3. Crear asistentes
  //     const decoded: any = this.jwtService.decodeMetadata(String(order.metadataToken));

  //     function isAttendeeDto(obj: any): obj is AttendeeDto {
  //       return (
  //         obj &&
  //         typeof obj === 'object' &&
  //         typeof obj.name === 'string' &&
  //         typeof obj.cuil === 'string'
  //       );
  //     }

  //     function isAttendeeDtoArray(arr: any): arr is AttendeeDto[] {
  //       return Array.isArray(arr) && arr.every(isAttendeeDto);
  //     }

  //     if (!decoded || !('attendees' in decoded) || !isAttendeeDtoArray(decoded.attendees)) {
  //       this.logger.error('Formato inválido de asistentes en metadataToken.');
  //       throw new Error('Invalid attendee format');
  //     }

  //     for (const attendee of decoded.attendees) {
  //       await tx.invitee.create({
  //         data: {
  //           name: attendee.name,
  //           cuil: attendee.cuil,
  //           orderId: order.id,
  //           paymentId: paymentNew.id,
  //         },
  //       });
  //     }

  //     return 'OK';
  //   }).catch((err) => {
  //     this.logger.error(`Error en verificación de transferencia: ${err.message}`);
  //     return 'ERROR';
  //   });
  // }
  // async verifyTransferDeOtrasPlataformas(paymentId: string, orderId: string) {
  //   const today = new Date();
  //   const pastDate = new Date(today);
  //   pastDate.setDate(today.getDate() - 20);

  //   // Formatear fechas en formato ISO (o el requerido por la API de MP)
  //   const begin = pastDate.toISOString(); // fecha 20 días atrás
  //   const end = today.toISOString();      // fecha actual
  //   const trans = await this.mpService.getPaymentsByDateRange(begin, end);
  //   const countId = await this.mpService.getCollectorId()

  //   // return payment
  //   const transaction = trans.results
  //     .filter(transaccion => {
  //       const transaction_id = transaccion.transaction_details?.transaction_id;

  //       const esTransferencia = ['bank_transfer', 'account_money'].includes(transaccion.payment_type_id);
  //       const esAprobado = transaccion.status === 'approved';
  //       const coincideDestino = transaccion.collector_id === countId;
  //       const coincideId = String(paymentId) === String(transaction_id);
  //       return esTransferencia && esAprobado && coincideDestino && coincideId;
  //     });

  //   if (transaction.length === 0) {
  //     console.warn('⚠️ No se encontró ninguna transacción que coincida con los criterios.');
  //   }
  //   const payment = transaction[0]



  //   const order = await this.prisma.order.findFirst({
  //     where: { id: orderId, paymentType: 'TRANSFER' },
  //   });

  //   // Validación de metadata
  //   const token = order?.metadataToken;
  //   if (!token) {
  //     this.logger.error('No se encontró token en metadata del pago.');
  //     return 'ERROR';
  //   }

  //   let payload: any;
  //   try {
  //     payload = this.jwtService.verifyMetadata(token);
  //     if (!payload) throw new Error('JWT inválido o expirado.');
  //   } catch (err) {
  //     this.logger.error(`Error al verificar el JWT: ${err.message}`);
  //     return 'ERROR';
  //   }

  //   if (
  //     payment.transaction_amount !== payload.totalAmount ||
  //     payment.currency_id !== payload.currency
  //   ) {
  //     this.logger.error(`Monto o moneda no coinciden`);
  //     return 'ERROR';
  //   }
  //   const newStatus: OrderStatus = OrderStatus.PAID;
  //   // Transacción completa
  //   return await this.prisma.$transaction(async (tx) => {
  //     // 1. Actualizar estado de orden
  //     await tx.order.update({
  //       where: { id: order.id },
  //       data: { status: newStatus },
  //     });

  //     // 2. Registrar pago
  //     const paymentNew = await tx.payment.create({
  //       data: {
  //         year: new Date().getFullYear(),
  //         orderId: order.id,
  //         amount: payment.transaction_amount,
  //         type: PaymentType.MERCADOPAGO,
  //         externalReference: String(payment.id),
  //         userId: payload.userId,
  //         payerEmail: payment.payer?.email || payload.metadata?.email,
  //         payerName: ` ${payment.payer?.first_name} ${payment.payer?.last_name} -${payment.payer?.email} - phone ${payment.payer?.phone.number} - ${payment.payer?.identification.number} ${payment.payer?.identification.type}`,
  //         payerDni: String(payment.payer?.identification.number || payload.metadata?.cuil),
  //         payerPhone: payment.payer?.phone?.number || payload.metadata?.phone,
  //       },
  //     });

  //     // 3. Crear asistentes
  //     const decoded: any = this.jwtService.decodeMetadata(String(order.metadataToken));

  //     function isAttendeeDto(obj: any): obj is AttendeeDto {
  //       return (
  //         obj &&
  //         typeof obj === 'object' &&
  //         typeof obj.name === 'string' &&
  //         typeof obj.cuil === 'string'
  //       );
  //     }

  //     function isAttendeeDtoArray(arr: any): arr is AttendeeDto[] {
  //       return Array.isArray(arr) && arr.every(isAttendeeDto);
  //     }

  //     if (!decoded || !('attendees' in decoded) || !isAttendeeDtoArray(decoded.attendees)) {
  //       this.logger.error('Formato inválido de asistentes en metadataToken.');
  //       throw new Error('Invalid attendee format');
  //     }

  //     for (const attendee of decoded.attendees) {
  //       await tx.invitee.create({
  //         data: {
  //           name: attendee.name,
  //           cuil: attendee.cuil,
  //           orderId: order.id,
  //           paymentId: paymentNew.id,
  //         },
  //       });
  //     }

  //     return 'OK';
  //   }).catch((err) => {
  //     this.logger.error(`Error en verificación de transferencia: ${err.message}`);
  //     return 'ERROR';
  //   });
  // }





}