/* eslint-disable prettier/prettier */
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CombosModule } from './combos/combos.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaService } from 'prisma/prisma.service';
import { MercadopagoModule } from './mercadopago/mercadopago.module';
import { MailModule } from './mail/mail.module';
import { RawBodyMiddleware } from './middlewares/raw-body'; // Asegúrate de que la ruta sea correcta
import { json } from 'express';

@Module({
  imports: [UsersModule, CombosModule, OrdersModule, PaymentsModule, MercadopagoModule,MailModule],
  controllers: [AppController],
  providers: [AppService
    , PrismaService
  ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
    // Aplica el RawBodyMiddleware solo a la ruta específica
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({ path: 'mercadopago/webhook/payment', method: RequestMethod.POST });

    // Aplica el middleware de JSON a todas las rutas
    consumer
      .apply(json({ limit: '1mb' }))
      .forRoutes('*');  // Aplica a todas las rutas
  }

}
