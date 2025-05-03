/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CombosModule } from './combos/combos.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
// import { PrismaService } from 'prisma/prisma.service';
import { MercadopagoModule } from './mercadopago/mercadopago.module';

@Module({
  imports: [UsersModule, CombosModule, OrdersModule, PaymentsModule, MercadopagoModule],
  controllers: [AppController],
  providers: [AppService
    // , PrismaService
  ]
})
export class AppModule {}
