/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { HttpService } from '@nestjs/axios';
import { CombosService } from 'src/combos/combos.service';
import { JwtService } from 'src/jwt/jwt.service';
import { PrismaService } from 'prisma/prisma.service';
import { OrderStatus } from 'src/orders/orders.service';
import { PaymentType } from '@prisma/client';
import { AttendeeDto, CreatePreferenceDto } from './DTOs/create-preference.dto';
import { CustomError } from 'src/global/CustomError';
import { firstValueFrom } from 'rxjs';

interface MetadataPayload {
  userId: string | null;
  eventId: string;
  comboId: string;
  quantity: number;
  email: string;
  cuil: string;
  totalAmount: number;
  currency: string;
  attendees: AttendeeDto
}

@Injectable()
export class MercadopagoService {
  private mpConfig: MercadoPagoConfig;
  private paymentClient: Payment;
  private readonly logger = new Logger(MercadopagoService.name);
  private readonly BASE_URL = 'https://api.mercadopago.com/v1/payments/search'

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly combosService: CombosService,
    private readonly jwtService: JwtService,
  ) {
    const token = process.env.MP_ACCESS_TOKEN!;
    this.mpConfig = new MercadoPagoConfig({ accessToken: token });
    this.paymentClient = new Payment(this.mpConfig);
  }

async createPreference(dto: CreatePreferenceDto): Promise<string> {
  // 1) Obtener combo y payload para validaciones
  const combo = await this.combosService.findOne(dto.id);
  if (!combo) throw new CustomError(404, 'Combo no encontrado', 'No pudimos encontrar el combo solicitado.');

  const payloadForCheck = { comboId: dto.id, email: dto.email, cuil: dto.cuil };

  // 2) Validar órdenes pendientes
  const pendingOrders = await this.prisma.order.findMany({
    where: { status: OrderStatus.PENDING, paymentType: PaymentType.MERCADOPAGO, eventId: dto.eventId }
  });
  for (const order of pendingOrders) {
    if (!order.metadataToken) continue;
    let existing: Record<string, any> | null;
    try {
      existing = this.jwtService.verifyMetadata(order.metadataToken);
    } catch {
      continue;
    }
    if (!existing) continue;
    if (
      existing.comboId === payloadForCheck.comboId &&
      existing.email === payloadForCheck.email &&
      existing.cuil === payloadForCheck.cuil
    ) {
      throw new CustomError(400, 'Ya existe una orden pendiente', 'Ya existe una orden pendiente para este combo con este email y CUIL.');
    }
  }

  // 3) Transacción: crear orden, token con orderId, preferencia y actualizar orden
  return await this.prisma.$transaction(async (tx) => {
    // 3.1) Crear orden pendiente (sin token ni referencia externa)
    const totalAmount = combo.price * combo.minPersons;
    const order = await tx.order.create({
      data: {
        year: new Date().getFullYear(),
        userId: dto.userId,
        eventId: dto.eventId,
        total: totalAmount,
        status: OrderStatus.PENDING,
        paymentType: PaymentType.MERCADOPAGO,
        combos: { connect: [{ id: combo.id }] },
      },
    });

    // 3.2) Generar token de metadata incluyendo el id de la orden
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

    // 3.3) Crear preferencia en MercadoPago
    const preferenceRequest = {
      items: [{ id: combo.id, title: combo.name, unit_price: combo.price, quantity: combo.minPersons }],
      metadata: { token: metadataToken },
      external_reference: String(order.id),
    };
    const preference = await new Preference(this.mpConfig).create({ body: preferenceRequest });
    if (!preference?.id || !preference.init_point) {
      throw new CustomError(500, 'Error en la creación de preferencia', 'No se pudo crear la preferencia de pago.');
    }

    // 3.4) Actualizar orden con metadataToken y externalReference
    await tx.order.update({
      where: { id: order.id },
      data: { metadataToken, externalReference: preference.id },
    });

    return preference.init_point;
  }).catch(error => {
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, 'Error inesperado', 'Hubo un error inesperado. Por favor, intenta de nuevo.');
  });
}



  async processNotification(rawBody: string): Promise<'OK' | 'ERROR'> {
    this.logger.log('Iniciando procesamiento de notificación de pago...');

    // 1) Parsear la notificación
    let data;
    try {
      const parsed = JSON.parse(rawBody);
      data = parsed.data;
      this.logger.debug(`Datos de notificación recibidos: ${JSON.stringify(data)}`);
    } catch (err) {
      this.logger.error(`Error al parsear notificación: ${err.message}`);
      return 'ERROR';
    }

    const paymentId = data.id;
    this.logger.debug(`ID de pago recibido: ${paymentId}`);

    // 2) Obtener detalles del pago
    let mpPayment;
    try {
      mpPayment = await this.paymentClient.get({ id: paymentId });
      this.logger.debug(`Detalles del pago obtenidos: ${JSON.stringify(mpPayment)}`);
    } catch (err) {
      this.logger.error(`Error al obtener detalles de pago de MP: ${err.message}`);
      return 'ERROR';
    }

    // 3) Validar JWT interno
    const token = mpPayment.metadata?.token;
    if (!token) {
      this.logger.error('No se encontró token en metadata del pago.');
      return 'ERROR';
    }

    let payload: any;
    try {
      payload = this.jwtService.verifyMetadata(token);
      this.logger.debug(`Payload del token: ${JSON.stringify(payload)}`);
      if (!payload) {
        this.logger.error('JWT inválido o expirado.');
        return 'ERROR';
      }
    } catch (err) {
      this.logger.error(`Error al verificar el JWT: ${err.message}`);
      return 'ERROR';
    }

    // 4) Validar monto y moneda
    if (
      mpPayment.transaction_amount !== payload.totalAmount ||
      mpPayment.currency_id !== payload.currency
    ) {
      this.logger.error(
        `Monto o moneda no coinciden. MP=${mpPayment.transaction_amount}/${mpPayment.currency_id}, Payload=${payload.totalAmount}/${payload.currency}`,
      );
      return 'ERROR';
    }
    console.log(payload);
    
    // 5) Buscar y actualizar orden interna
    this.logger.debug(`Buscando orden con externalReference: ${data.preference_id}`);
    const order = await this.prisma.order.findUnique({
      where: { id: payload.orderId },
    });

    if (!order) {
      this.logger.error(`Orden interna no encontrada: ${data.preference_id}`);
      return 'ERROR';
    }

    this.logger.debug(`Orden encontrada: ID=${order.id}, estado actual=${order.status}`);

    let newStatus: OrderStatus;
    switch (mpPayment.status) {
      case 'approved':
        newStatus = OrderStatus.APPROVED;
        break;
      case 'pending':
        newStatus = OrderStatus.PENDING;
        break;
      case 'rejected':
        newStatus = OrderStatus.REJECTED;
        break;
      default:
        this.logger.warn(`Estado de pago no manejado: ${mpPayment.status}`);
        newStatus = OrderStatus.PENDING;
    }

    this.logger.debug(`Nuevo estado de la orden será: ${newStatus}`);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });

    // 6) Registrar pago
    this.logger.debug('Registrando pago en base de datos...');
    console.log(mpPayment);
    
    const payment = await this.prisma.payment.create({
      data: {
        year: new Date().getFullYear(),
        orderId: order.id,
        amount: mpPayment.transaction_amount,
        type: PaymentType.MERCADOPAGO,
        externalReference: String(mpPayment.id),
        userId: payload.userId,
        payerEmail: mpPayment.payer?.email ||payload.metadata?.email,
        payerName: ` ${mpPayment.payer?.first_name} ${mpPayment.payer?.last_name} -${mpPayment.payer?.email} - phone ${mpPayment.payer?.phone.number} - ${mpPayment.payer?.identification.number} ${mpPayment.payer?.identification.type}`,
        payerDni: String(mpPayment.payer?.identification.number ||  payload.metadata?.cuil) ,
      },
    });
    this.logger.debug(`Pago registrado: ID=${payment.id}`);

    // 7) Crear asistentes (invitees)
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

    if (payment) {
      this.logger.debug('Decodificando metadataToken de la orden para obtener asistentes...');
      const decoded: any = this.jwtService.decodeMetadata(String(order.metadataToken));

      if (!decoded || !('attendees' in decoded) || !isAttendeeDtoArray(decoded.attendees)) {
        this.logger.error('Formato inválido de asistentes en metadataToken.');
        return 'ERROR';
      }

      const attendees: AttendeeDto[] = decoded.attendees;
      this.logger.debug(`Se encontraron ${attendees.length} asistentes para registrar.`);

      for (const attendee of attendees) {
        await this.prisma.invitee.create({
          data: {
            name: attendee.name,
            cuil: attendee.cuil,
            orderId: order.id,
            paymentId: payment.id,
          },
        });
        this.logger.debug(`Invitee creado: ${attendee.name} (${attendee.cuil})`);
      }

      this.logger.log(`Se crearon ${attendees.length} asistentes para la orden ID=${order.id}`);
    }

    this.logger.log('Notificación procesada correctamente.');
    return 'OK';
  }

  async getPaymentsBetweenDates(begin: string, end: string): Promise<any> {
    const url = `${this.BASE_URL}?range=date_created&begin_date=${begin}&end_date=${end}`;

    const headers = {
      Authorization: `Bearer ${this.mpConfig.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        this.http.get(url, { headers })
      );
      return response.data;
    } catch (error) {
      console.error('Error al consultar pagos en Mercado Pago:', error.response?.data || error.message);
      throw error;
    }
  }
}
