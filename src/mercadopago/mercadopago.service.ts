/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { CreatePreferenceDto } from './DTOs/create-preference.dto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Payment } from "mercadopago";
import { PaymentGetResponse } from './types';
import { MpSignatureService } from './mp-signature.service';
import { CombosService } from 'src/combos/combos.service';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { OrdersService } from 'src/orders/orders.service';
import { PaymentType } from '@prisma/client';

@Injectable()
export class MercadopagoService {
  private mp: MercadoPagoConfig;
  private credentials: string;
  private readonly BASE_URL = 'https://api.mercadopago.com/v1/payments/search';
  private readonly logger = new Logger(MercadopagoService.name);
  private readonly payment: Payment;

  constructor(
    private readonly http: HttpService,
    private readonly sigService: MpSignatureService,
    private readonly combosService: CombosService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly ordersService: OrdersService,

  ) {
    this.credentials = process.env.MP_ACCESS_TOKEN!;
    this.mp = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    this.payment = new Payment(this.mp);
  }

  async createPreference(dto: CreatePreferenceDto): Promise<string> {
    const year = new Date().getFullYear();
  // Buscar el combo correspondiente
  const combo = await this.combosService.findOne(dto.id);
  if (!combo) throw new Error('Combo no encontrado');

  // Construir metadata
  const metadata = {
    email: dto.email,
    minPersons: dto.minPersons,
    id: combo.id,
    title: combo.name,
    quantity: combo.minPersons,
    unit_price: combo.price,
  };

  // Firmar metadata con JWT
  const metadataJwt = this.jwtService.signMetadata(metadata);

  // Crear la preferencia de pago
  const preference = await new Preference(this.mp).create({
    body: {
      items: [
        {
          id: combo.id,
          title: combo.name,
          unit_price: combo.price,
          quantity: combo.minPersons,
        },
      ],
      metadata: {
        token: metadataJwt,
      },
    },
  });

  if (!preference || !preference.id || !preference.init_point) {
    throw new Error('No se pudo crear la preferencia de pago');
  }

  // Crear orden inicial (estado pendiente)
  const newOrder = await this.ordersService.createOrder({
    id: preference.id,
    comboId: combo.id,
    userId: dto.userId ?? null,
    paymentType: PaymentType.MERCADOPAGO,
    metadataToken: metadataJwt,
    year,
    quantity: combo.minPersons,
    unitPrice: combo.price
  });
  if (!newOrder) {
    throw new Error('no se pudo crear la orden')
  }
  return preference.init_point;
}

  async getPaymentsBetweenDates(begin: string, end: string): Promise<any> {
    const url = `${this.BASE_URL}?range=date_created&begin_date=${begin}&end_date=${end}`;

    const headers = {
      Authorization: `Bearer ${this.credentials}`,
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
  async getPaymentDetails(paymentId: string): Promise<PaymentGetResponse> {
    try {
      const response = await this.payment.get({ id: paymentId });
      return response;
    } catch (error) {
      this.logger.error(`Error al obtener los detalles del pago: ${error.message}`);
      throw error;
    }
  }
  verify(signature: string, rawBody: Buffer): boolean {
    return this.sigService.verify(signature, rawBody);
  }
}


