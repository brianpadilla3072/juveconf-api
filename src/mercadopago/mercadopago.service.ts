/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { CreatePreferenceDto } from './DTOs/create-preference.dto';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadopagoService {
  private mp: MercadoPagoConfig;

  constructor() {
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
}
