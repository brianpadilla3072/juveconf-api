/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MercadopagoController } from './mercadopago.controller';
import { MercadopagoService } from './mercadopago.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [MercadopagoController],
  providers: [MercadopagoService],
  imports: [HttpModule],
})
export class MercadopagoModule {}
