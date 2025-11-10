import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CombosModule } from './combos/combos.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaService } from 'prisma/prisma.service';
import { MercadopagoModule } from './mercadopago/mercadopago.module';
import { MailModule } from './mail/mail.module';
import { RawBodyMiddleware } from './middlewares/raw-body';
import { json } from 'express';
import { EventModule } from './events/event.module';
import { TransfersModule } from './transfers/transfers.module';
import { AuthModule } from './auth/auth.module';
import { InviteesModule } from './invitees/invitees.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { PresalesModule } from './presales/presales.module';
import { EmailQueueModule } from './email-queue/email-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UsersModule,
    CombosModule,
    OrdersModule,
    PaymentsModule,
    MercadopagoModule,
    MailModule,
    EventModule,
    TransfersModule,
    AuthModule,
    InviteesModule,
    DashboardModule,
    FinanzasModule,
    PresalesModule,
    EmailQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica el RawBodyMiddleware solo a la ruta específica
    consumer.apply(RawBodyMiddleware).forRoutes({
      path: 'mercadopago/webhook/payment',
      method: RequestMethod.POST,
    });

    consumer.apply(json({ limit: '1mb' })).forRoutes('*');
  }
}
