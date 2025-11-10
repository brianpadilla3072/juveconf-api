/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { MercadopagoService } from 'src/mercadopago/mercadopago.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { CombosService } from 'src/combos/combos.service';
import { OrdersService } from 'src/orders/orders.service';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';

@Module({
  imports: [HttpModule, MailModule, EmailQueueModule],
  controllers: [TransfersController],
  providers: [TransfersService, MercadopagoService, PrismaService, JwtService, CombosService, OrdersService, MailService],
})
export class TransfersModule {}
