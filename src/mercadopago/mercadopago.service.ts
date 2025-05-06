/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { CreatePreferenceDto } from './DTOs/create-preference.dto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MercadopagoService {
  private mp: MercadoPagoConfig;
  private credentials:string
  private readonly BASE_URL = 'https://api.mercadopago.com/v1/payments/search';
  constructor(private readonly http: HttpService) {
    this.credentials= process.env.MP_ACCESS_TOKEN!
    this.mp = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    
  }

  async createPreference(dto: CreatePreferenceDto): Promise<string> {
    const preference = await new Preference(this.mp).create({
      body: {
        items: [
          {
            id: dto.id,
            title: dto.title,
            unit_price: dto.unit_price,
            quantity: dto.quantity,
          },
        ],
        metadata: {
          email: dto.email,
          maxPersons: dto.maxPersons,
          minPersons: dto.minPersons,
        },
      },
    });
    
    return preference.init_point!;
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
}
