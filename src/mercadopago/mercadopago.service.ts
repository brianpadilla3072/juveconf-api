/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
// ----------------------- MercadopagoService.ts -----------------------
import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { HttpService } from '@nestjs/axios';
import { CombosService } from 'src/combos/combos.service';
import { JwtService } from 'src/jwt/jwt.service';
import { PrismaService } from 'prisma/prisma.service';
import { OrderStatus } from 'src/orders/orders.service';
import { PaymentType } from '@prisma/client';
import { CreatePreferenceDto } from './DTOs/create-preference.dto';
import { CustomError } from 'src/global/CustomError';
import { firstValueFrom } from 'rxjs';



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
  try {
    // 1) Obtener combo
    const combo = await this.combosService.findOne(dto.id);
    if (!combo) throw new CustomError(404, 'Combo no encontrado', 'No pudimos encontrar el combo solicitado.');

    // 1.1) VERIFICACION DE SEGURIDAD
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        paymentType: PaymentType.MERCADOPAGO,
        eventId: dto.eventId,
      },
    });

    // Validar órdenes pendientes
    for (const order of pendingOrders) {
      const token = order.metadataToken;
      if (!token) {
        continue;
      }

      let payload: Record<string, any> | null = null;
      try {
        payload = this.jwtService.verifyMetadata(token);
      } catch (err) {
        this.logger.warn(`Error al verificar token de orden ID ${order.id}: ${err.message}`);
        continue;
      }

      if (
        payload &&
        payload.comboId === dto.id &&
        payload.email === dto.email &&
        payload.cuil === dto.cuil
      ) {
        throw new CustomError(400, 'Ya existe una orden pendiente', 'Ya existe una orden pendiente para este combo con este email y CUIL.');
      }
    }

    // 2) Calcular total y crear JWT interno
    const totalAmount = combo.price * combo.minPersons;
    const payload = {
      userId: dto.userId || null,
      eventId: dto.eventId,
      comboId: combo.id,
      quantity: dto.quantity,
      email: dto.email,
      cuil: dto.cuil,
      totalAmount,
      currency: 'ARS',
    };
    const metadataToken = this.jwtService.signMetadata(payload);

    // 3) Crear orden pendiente en la base de datos
    const order = await this.prisma.order.create({
      data: {
        year: new Date().getFullYear(),
        userId: dto.userId,
        eventId: dto.eventId,
        total: totalAmount,
        status: OrderStatus.PENDING,
        paymentType: PaymentType.MERCADOPAGO,
        metadataToken,
        combos: {
        connect:  [{ id: combo.id }]
    },
      },
    });

    // 4) Crear preferencia en MercadoPago
    const preferenceRequest = {
      items: [{
        id: combo.id,
        title: combo.name,
        unit_price: combo.price,
        quantity: combo.minPersons,
      }],
      metadata: { token: metadataToken },
      external_reference: String(order.id),
    };
    const preference = await new Preference(this.mpConfig).create({ body: preferenceRequest });
    if (!preference?.id || !preference.init_point) {
      throw new CustomError(500, 'Error en la creación de preferencia', 'No se pudo crear la preferencia de pago.');
    }

    // 5) Guardar referencia externa en la orden
    await this.prisma.order.update({
      where: { id: order.id },
      data: { externalReference: preference.id },
    });

    return preference.init_point;
  } catch (error) {
    if (error instanceof CustomError) {
      // Enviar el error como una respuesta manejada
      throw error;
    }
    this.logger.error('Error en la creación de preferencia:', error.message);
    throw new CustomError(500, 'Error inesperado', 'Hubo un error inesperado. Por favor, intenta de nuevo.');
  }
}


  async processNotification(rawBody: string): Promise<'OK' | 'ERROR'> {
    this.logger.debug('===> Iniciando procesamiento de notificación');

    // 1) Parsear la notificación
    let data;
    try {
      const parsed = JSON.parse(rawBody);
      data = parsed.data;
      this.logger.debug(`Datos de notificación recibidos: ${JSON.stringify(data)}`);
    } catch (err) {
      this.logger.error('Error al parsear el cuerpo de la notificación:', err.message);
      return 'ERROR';
    }

    const paymentId = data.id;
    this.logger.debug(`ID de pago recibido: ${paymentId}`);

    // 2) Obtener detalles del pago
    let mpPayment;
    try {
      mpPayment = await this.paymentClient.get({ id: paymentId });
      this.logger.debug(`Detalles de pago: ${JSON.stringify(mpPayment)}`);
    } catch (err) {
      this.logger.error(`Error al obtener detalles de pago: ${err.message}`);
      return 'ERROR';
    }

    // 3) Validar JWT interno
    const token = mpPayment.metadata?.token;
    if (!token) {
      this.logger.error('No se encontró token en metadata');
      return 'ERROR';
    }

    // Obtener el payload del token JWT
    let payload: any;
    try {
      payload = this.jwtService.verifyMetadata(token); // Ya se maneja la verificación aquí
      if (!payload) {
        this.logger.error('JWT inválido o expirado');
        return 'ERROR';
      }
      this.logger.debug(`Payload JWT decodificado: ${JSON.stringify(payload)}`);
    } catch (err) {
      this.logger.error('Error al verificar el JWT:', err.message);
      return 'ERROR';
    }

    // 4) Validar monto y moneda
    this.logger.debug(`Comparando montos: MP=${mpPayment.transaction_amount} vs JWT=${payload.totalAmount}`);
    this.logger.debug(`Comparando monedas: MP=${mpPayment.currency_id} vs JWT=${payload.currency}`);

    if (
      mpPayment.transaction_amount !== payload.totalAmount ||
      mpPayment.currency_id !== payload.currency
    ) {
      this.logger.error('Monto o moneda no coinciden');
      return 'ERROR';
    }

    // 5) Buscar y actualizar orden interna
    this.logger.debug(`Buscando orden con externalReference: ${data.preference_id}`);

    const order = await this.prisma.order.findFirst({
      where: { externalReference: data.preference_id },
    });
    if (!order) {
      this.logger.error('Orden interna no encontrada:', data.preference_id);
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
        this.logger.warn('Estado no manejado:', mpPayment.status);
        newStatus = OrderStatus.PENDING;
    }

    this.logger.debug(`Nuevo estado de la orden: ${newStatus}`);

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });

    // 6) Registrar pago en BD
    this.logger.debug('Registrando nuevo pago en base de datos');

    await this.prisma.payment.create({
      data: {
        year: new Date().getFullYear(),
        orderId: order.id,
        amount: mpPayment.transaction_amount,
        type: PaymentType.MERCADOPAGO,
        externalReference: String(mpPayment.id),
        userId: payload.userId,
        payerEmail: payload.metadata?.email,
        payerName: `${mpPayment.payer?.first_name} ${mpPayment.payer?.last_name}`,
        payerDni: payload.metadata?.cuil || null,
      },
    });

    this.logger.debug('Procesamiento de notificación finalizado correctamente');
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
