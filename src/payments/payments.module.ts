/* eslint-disable prettier/prettier */
import { PrismaService } from 'prisma/prisma.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '../jwt/jwt.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [JwtModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
})
export class PaymentsModule {}