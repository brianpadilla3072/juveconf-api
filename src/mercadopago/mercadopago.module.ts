/* eslint-disable prettier/prettier */
// import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MercadopagoController } from './mercadopago.controller';
import { MercadopagoService } from './mercadopago.service';
import { HttpModule } from '@nestjs/axios';
import { MpSignatureService } from './mp-signature.service';
import { Module } from '@nestjs/common';
import { CombosService } from 'src/combos/combos.service';
import { PrismaModule } from 'prisma/prisma.module';
import { JwtModule } from "src/jwt/jwt.module";
import { OrdersService } from 'src/orders/orders.service';

@Module({
  imports: [HttpModule,PrismaModule,JwtModule],
  providers: [MpSignatureService, MercadopagoService, CombosService,OrdersService],
  controllers: [MercadopagoController],
})
export class MercadopagoModule{}