/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { PaymentsService } from 'src/payments/payments.service';
import { InviteesService } from 'src/invitees/invitees.service';
import { UsersModule } from 'src/users/users.module';
import { PasswordService } from 'src/global/password.service';

@Module({
  imports: [UsersModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PrismaService,
    JwtService,
    PaymentsService,
    InviteesService,
    PasswordService
  ],
  exports: [OrdersService]
})
export class OrdersModule {
  constructor(private readonly ordersService: OrdersService) {}
  
}
