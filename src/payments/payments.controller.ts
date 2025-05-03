/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout')
  async checkout(@Body('orderId') orderId: number) {
    const url = await this.paymentsService.createPreference(orderId);
    return { init_point: url };
  }

  @Post('webhook')
  async handleWebhook(@Body() data: any) {
    await this.paymentsService.handleWebhook(data);
    return { status: 'ok' };
  }
}

