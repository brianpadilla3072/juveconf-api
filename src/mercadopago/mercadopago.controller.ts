/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { CreatePreferenceDto } from './DTOs/create-preference.dto';

@Controller('mercadopago')
export class MercadopagoController {
  constructor(private readonly mpService: MercadopagoService) {}

  @Post('preference')
  async createPreference(@Body() dto: CreatePreferenceDto) {
    const initPoint = await this.mpService.createPreference(dto);
    return { initPoint };
  }
}
