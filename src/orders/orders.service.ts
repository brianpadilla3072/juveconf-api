/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import { 
  BadRequestException, 
  Injectable,
  InternalServerErrorException, 
  Logger, 
  NotFoundException 
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Order, PaymentType, OrderStatus } from '@prisma/client';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
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
  }) {
    const { userId, comboId, paymentType, quantity, unitPrice, metadataToken, id,email,cuil } = data;
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
        year,
        total,
        status: OrderStatus.PENDING,
        paymentType,
        metadataToken,
        email,
        cuil,
        combos: {
          connect: [{ id: comboId }],
        },
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
      include: { combos: true },
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

    const total = combo.price * combo.minPersons;

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        total,
        paymentType,
        combos: {
          set: [],
          connect: { id: comboId },
        },
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
    return this.prisma.order.findMany({
      where: { status },
      include: {
        user: true,
        event: true,
        combos: true,
        payments: true,
        invitees: true
      },
      orderBy: {
        createdAt: 'desc'
      }
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

  async approveOrder(orderId: string): Promise<{success: boolean, data: Order}> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar el estado de la orden
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
        include: { user: true }
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
          payerEmail: order.user?.email || undefined,
          payerName: order.user?.name || '',
          payerDni: metadataPayload.cuil || undefined,
        }
      });

      // 4. Crear invitados si existen
      if (metadataPayload.attendees?.length) {
        await Promise.all(
          metadataPayload.attendees.map(attendee => 
            tx.invitee.create({
              data: {
                name: attendee.name,
                cuil: attendee.cuil,
                orderId: order.id,
                paymentId: payment.id,
              }
            })
          )
        );
      }

      return { success: true, data: order };
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    });
  }

  async deleteOrder(orderId: string): Promise<Order> {
    // First, check if the order has any payments
    const orderWithPayments = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!orderWithPayments) {
      throw new NotFoundException('Order not found');
    }

    // If the order has payments, throw an error
    if (orderWithPayments.payments && orderWithPayments.payments.length > 0) {
      throw new BadRequestException('Cannot delete an order with associated payments');
    }

    // Perform logical deletion by setting deletedAt
    return this.prisma.order.update({
      where: { id: orderId },
      data: { 
        deletedAt: new Date() 
      }
    });
  }
}
export { OrderStatus };

