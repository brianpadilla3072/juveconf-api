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
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';

@Module({
  imports: [HttpModule, PrismaModule, JwtModule, MailModule, EmailQueueModule],
  providers: [MpSignatureService, MercadopagoService, CombosService, OrdersService, MailService],
  controllers: [MercadopagoController],
})
export class MercadopagoModule{}