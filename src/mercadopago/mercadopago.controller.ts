/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
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

  @Post('webhook/payment')
  @HttpCode(200)
  async handleNotification(@Req() req: any) {
    const result = await this.mpService.processNotification(req.rawBody.toString());
    return result;
  }
  //   @Get('movements')
  // async getLast20DaysPayments() {
  //   const today = new Date();
  //   const pastDate = new Date(today);
  //   pastDate.setDate(today.getDate() - 20);

  //   const begin = pastDate.toISOString();
  //   const end = today.toISOString();

  //   const payments = await this.mpService.getPaymentsByDateRange(begin, end);
  //   return payments;
  // }
}