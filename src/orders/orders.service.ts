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
import { Order, PaymentType, OrderStatus } from '@prisma/client';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService
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
        year,
        total,
        status: OrderStatus.PENDING,
        paymentType,
        metadataToken,
        email,
        cuil,
        phone,
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
    const orders = await this.prisma.order.findMany({
      where: { 
        status,
        deletedAt: null
      },
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
          if (order.invitees.length === 0 && metadataPayload?.attendees?.length) {
            const virtualInvitees = metadataPayload.attendees.map(attendee => ({
              id: `virtual-${order.id}-${attendee.cuil}`,
              name: attendee.name,
              cuil: attendee.cuil,
              orderId: order.id,
              paymentId: null,
              attendedDay1: false,
              attendedDay2: false,
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

  async approveOrder(orderId: string): Promise<{success: boolean, data: Order}> {
    
    let emailData: any; // Variable para almacenar datos del email
    
    const result = await this.prisma.$transaction(async (tx) => {
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
      
      // 5. Preparar datos del email (NO enviarlo dentro de la transacción)
      const template = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Descargar Entrada</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; padding: 30px; box-shadow: 0 0 5px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <h1 style="color: #2c3e50; margin: 0;">¡Gracias por tu compra!</h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 10px 0;">
                <p style="font-size: 16px; color: #333333; margin: 0;">El ID de tu Compra es:</p>
                <p style="font-size: 16px; font-weight: bold; color: #f76f1f; word-break: break-word; margin: 5px 0 20px;">${payment.id}</p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hacé clic en el botón para ir a la página donde podés descargar tu entrada:</p>
                <a href="https://consagradosajesus.com/descargar-entrada/${payment.id}"
                  style="background-color: #f76f1f; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; display: inline-block; font-size: 16px; margin-top: 10px;">
                  Ir a la página de descarga
                </a>
                <p style="font-size: 14px; color: #555555; margin-top: 20px;">
                  O hacé clic en este enlace si el botón no funciona:<br />
                  <a href="https://consagradosajesus.com/descargar-entrada/${payment.id}"
                    style="color: #2980b9; text-decoration: underline;">https://consagradosajesus.com/descargar-entrada/${payment.id}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top: 30px;">
                <p style="font-size: 12px; color: #999999;">Este mensaje fue generado automáticamente. Por favor no respondas este correo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

      `;
      
      emailData = {
        to: order.email,
        html: template,
        subject: `YA PODES DESCARGAR TUS ENTRADAS: ${payment.id}`
      };
      
      return { success: true, data: order };
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    });
    
    // 6. Enviar email FUERA de la transacción
    if (emailData) {
      try {
        // Timeout de 5 segundos para evitar que se cuelgue
        const emailPromise = this.mailService.sendCustomEmail(emailData.to, emailData.html, emailData.subject);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email timeout')), 5000)
        );
        
        await Promise.race([emailPromise, timeoutPromise]);
        this.logger.log(`Email enviado exitosamente a ${emailData.to}`);
      } catch (error) {
        this.logger.error(`Error al enviar email: ${error.message}`);
        // El email falló, pero la orden ya está aprobada
      }
    }
    
    return result;
  }

  async deleteOrder(orderId: string): Promise<Order> {
    // First, check if the order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        payments: true,
        invitees: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // If the order has payments, throw an error
    if (order.payments && order.payments.length > 0) {
      throw new BadRequestException('Cannot delete an order with associated payments');
    }

    // Delete related invitees first (if any)
    if (order.invitees && order.invitees.length > 0) {
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

