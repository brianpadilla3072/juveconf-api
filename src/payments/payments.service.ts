/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { PrismaService } from '../../prisma/prisma.service';
import { 
  Injectable, 
  NotFoundException, 
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { CreatePaymentDto, UpdatePaymentDto } from './DTOs';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        ...createPaymentDto,
      },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const existingPayment = await this.findOne(id);
    return this.prisma.payment.update({
      where: { id: existingPayment.id },
      data: updatePaymentDto,
    });
  }

  async remove(id: string) {
    const existingPayment = await this.findOne(id);
    return this.prisma.payment.update({
      where: { id: existingPayment.id },
      data: { deletedAt: new Date() },
    });
  }

  async getPaymentWithInvitees(paymentId: string): Promise<{ token: string , invitees: any[]}> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              invitees: true
            }
          }
        }
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${paymentId} not found`);
      }

      const paymentData = {
        ...payment,
        invitees: payment.order?.invitees || []
      };

      // Create a token with the payment data using signMetadata
      const token = this.jwtService.signMetadata(paymentData);

      return { token, invitees: payment.order?.invitees || [] };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error getting payment with invitees: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Error retrieving payment data');
    }
  }
}