/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { PrismaService } from '../../prisma/prisma.service'; // Suponiendo que tienes un servicio de Prisma
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto, UpdatePaymentDto } from './DTOs';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const existingPayment = await this.findOne(id);
    return this.prisma.payment.update({
      where: { id: existingPayment.id },
      data: updatePaymentDto,
    });
  }

  async remove(id: number) {
    const existingPayment = await this.findOne(id);
    return this.prisma.payment.update({
      where: { id: existingPayment.id },
      data: { deletedAt: new Date() },
    });
  }
}