/* eslint-disable prettier/prettier */
 
 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Order, PaymentType, OrderStatus, EmailType } from '@prisma/client';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { APP_CONFIG, COLORS } from 'src/constants/app.constants';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { createMealSelections, nextRegistrationCode } from 'src/meals/meals-orders';
import { MealsQuote } from 'src/meals/meals-pricing';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private emailQueueService: EmailQueueService
  ) {}
  async createOrder(data: {
    id: string
    userId?: string | null;
    comboId: string;
    paymentType: PaymentType;
    year: number;
    quantity: number;
    unitPrice: number;
    metadataToken: string;
    email: string;
    cuil: string;
    phone?: string;
  }) {
    const { userId, comboId, paymentType, quantity, unitPrice, metadataToken, id,email,cuil,phone } = data;
    const year = new Date().getFullYear();

    // Buscar el combo
    const combo = await this.prisma.combo.findUnique({
      where: { id: comboId },
    });

    if (!combo) {
      throw new Error('Combo no encontrado');
    }
    const total = unitPrice * quantity;

    // Crear la orden y vincular el combo
    return this.prisma.order.create({
      data: {
        id,
        userId: userId ?? null,
        eventId: combo.eventId,
        comboId, // Relación directa one-to-one
        year,
        total,
        status: OrderStatus.PENDING,
        paymentType,
        metadataToken,
        email,
        cuil,
        phone,
      },
    });
  }

  async updateOrder(
    orderId: string,
    comboId: string,
    paymentType: PaymentType,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { Combo: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const combo = await this.prisma.combo.findUnique({
      where: { id: comboId },
    });

    if (!combo) {
      throw new BadRequestException('El combo no existe');
    }

    const total = combo.price * combo.personsIncluded;

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        total,
        paymentType,
        comboId, // Relación directa
      },
    });
  }
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
  async getOrdersByCuil(cuil: string) {

    // Obtener todas las órdenes
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING, paymentType: PaymentType.TRANSFER },
    });


    // Filtrar las órdenes que coinciden con el CUIL
    const filteredOrders = orders.filter((order) => {
      const token = order.metadataToken || ''; // Obtener el metadataToken de la orden
      let includesCuil: boolean  |null = false;

      try {
        // Verificar el token de la metadata
        const decodedPayload = this.jwtService.verifyMetadata(String(token));  // Decodificar el token
        includesCuil = decodedPayload && decodedPayload.cuil === cuil;  // Verificar si el CUIL coincide
      } catch (err) {
        this.logger.warn(`[OrdersService] Error al verificar el token de la orden ID ${order.id}: ${err.message}`);
      }

      return includesCuil;  // Solo las órdenes con el CUIL correcto son incluidas
    });


    return filteredOrders;  // Retornar las órdenes filtradas
  }
  async getOrdersByStatus(status: OrderStatus) {
    const orders = await this.prisma.order.findMany({
      where: {
        status,
        deletedAt: null
      },
      include: {
        User: true,
        Event: true,
        Combo: true, // Relación one-to-one
        Payment: true,
        Invitee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Para cada orden, extraer información del metadataToken incluyendo phone y attendees
    return orders.map(order => {
      if (order.metadataToken) {
        try {
          const metadataPayload = this.jwtService.decodeMetadata(order.metadataToken);
          
          // Agregar phone del metadataToken si existe
          const orderWithPhone = {
            ...order,
            phone: metadataPayload?.phone || null
          };

          // Si no tiene invitados creados pero tiene attendees en el token, crear invitados virtuales
          if (order.Invitee.length === 0 && metadataPayload?.attendees?.length) {
            const virtualInvitees = metadataPayload.attendees.map(attendee => ({
              id: `virtual-${order.id}-${attendee.cuil}`,
              name: attendee.name,
              cuil: attendee.cuil,
              orderId: order.id,
              paymentId: null,
              attendance: null,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              deletedAt: null,
              email: null,
              phone: null
            }));
            
            return {
              ...orderWithPhone,
              invitees: virtualInvitees
            };
          }

          return orderWithPhone;
        } catch (error) {
          this.logger.warn(`[OrdersService] Error al decodificar metadataToken para orden ${order.id}:`, error.message);
        }
      }
      
      return order;
    });
  }

  async moveToReview(orderId: string, email: string, cuil: string): Promise<{success: boolean,data: Order}> {
    // Validar parámetros de entrada
    if (!orderId || !email || !cuil) {
      throw new BadRequestException('ID de orden, email y CUIL son requeridos');
    }

    // Primero obtenemos la orden
    const order = await this.prisma.order.findFirst({
      where: { id: orderId }
    });
    
    try {
    if (!order) {
      throw new NotFoundException(`No se encontró la orden con ID: ${orderId}`);
    }
      // Si pasa las validaciones, actualizar el estado
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REVIEW },
      });

      return {success: true,data: updatedOrder};
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Reintenta las transacciones Serializable que fallan por conflicto (P2034)
  private async withSerializableRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        if (error?.code === 'P2034' && attempt < attempts) continue;
        throw error;
      }
    }
  }

  async approveOrder(orderId: string): Promise<{success: boolean, data: Order}> {

    const result = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
      // Ordenes con comidas: el desglose quedo en el snapshot al crearlas
      const pre = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true, orderSnapshot: true },
      });
      const mealsSnapshot = (pre?.orderSnapshot as any)?.meals as MealsQuote | undefined;
      if (mealsSnapshot && pre?.status === OrderStatus.PAID) {
        throw new BadRequestException('La orden ya fue aprobada');
      }

      // 1. Actualizar el estado de la orden
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID }
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // 2. Decodificar el token de metadatos
      const metadataPayload = this.jwtService.decodeMetadata(order.metadataToken || '');
      if (!metadataPayload) {
        throw new BadRequestException('Invalid metadata token');
      }

      // 3. Crear el pago
      const payment = await tx.payment.create({
        data: {
          year: order.year,
          orderId: order.id,
          amount: order.total,
          type: 'TRANSFER',
          externalReference: metadataPayload.orderId,
          userId: order.userId || undefined,
          payerEmail: order.email || undefined,
          payerName: metadataPayload.name || undefined,
          payerDni: metadataPayload.cuil || undefined,
          payerPhone: metadataPayload.phone || undefined,
        }
      });

      // 4. Crear invitados si existen
      if (metadataPayload.attendees?.length) {
        const inviteeData = (attendee: (typeof metadataPayload.attendees)[number]) => {
          // Parsear metadata si existe
          let parsedMetadata: any = {};
          if (attendee.metadata) {
            try {
              parsedMetadata = JSON.parse(attendee.metadata);
            } catch (error) {
              this.logger.warn(`Error parsing metadata for attendee ${attendee.name}: ${error.message}`);
            }
          }

          return {
            name: attendee.name,
            cuil: attendee.cuil,
            email: parsedMetadata.email || undefined,
            phone: parsedMetadata.phone || undefined,
            metadata: attendee.metadata || undefined, // Guardar metadata completa como JSON string
            orderId: order.id,
            paymentId: payment.id,
          };
        };

        if (mealsSnapshot) {
          // Modo comidas: en secuencia, cada invitado recibe su codigo de inscripcion y sus comidas
          for (const [index, attendee] of metadataPayload.attendees.entries()) {
            const registrationCode = await nextRegistrationCode(tx, order.eventId);
            const invitee = await tx.invitee.create({
              data: { ...inviteeData(attendee), registrationCode },
            });
            await createMealSelections(tx, {
              inviteeId: invitee.id,
              orderId: order.id,
              picks: mealsSnapshot.perAttendee[index]?.picks ?? [],
            });
          }
        } else {
          await Promise.all(
            metadataPayload.attendees.map(attendee => tx.invitee.create({ data: inviteeData(attendee) }))
          );
        }
      }

      return { success: true, data: order, payment };
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    }));

    // 5. Enqueue email OUTSIDE transaction (after commit)
    try {
      await this.emailQueueService.enqueueTemplateEmail({
        to: result.data.email,
        subject: `Tu entrada - JUVECONF ${result.data.year}`,
        template: 'ticket-details',
        context: {
          paymentId: result.payment.id,
          ticketUrl: `${APP_CONFIG.staticSiteUrlForEmails}/ticket/${result.payment.id}`,
        },
        emailType: EmailType.TICKET_DOWNLOAD,
        orderId: result.data.id,
        paymentId: result.payment.id,
      });
      this.logger.log(`Email encolado exitosamente para ${result.data.email}`);
    } catch (error: any) {
      this.logger.error(`Error al encolar email: ${error.message}`);
      // El email falló, pero la orden ya está aprobada
    }

    return { success: result.success, data: result.data };
  }

  async deleteOrder(orderId: string): Promise<Order> {
    // First, check if the order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        Payment: true,
        Invitee: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // If the order has payments, throw an error
    if (order.Payment && order.Payment.length > 0) {
      throw new BadRequestException('Cannot delete an order with associated payments');
    }

    // Delete related invitees first (if any)
    if (order.Invitee && order.Invitee.length > 0) {
      await this.prisma.invitee.deleteMany({
        where: { orderId: orderId }
      });
    }

    // Perform physical deletion
    return this.prisma.order.delete({
      where: { id: orderId }
    });
  }


}

export { OrderStatus };

