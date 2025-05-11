/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PaymentType } from '@prisma/client';
@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }
  async createOrder(data: {
  id:string
  userId?: string | null;
  comboId: string;
  paymentType: PaymentType;
  year: number;
  quantity: number;
  unitPrice: number;
  metadataToken: string;
}) {
  const { userId, comboId, paymentType, quantity, unitPrice, metadataToken,id } = data;
      const year = new Date().getFullYear();

  // Buscar el combo
  const combo = await this.prisma.combo.findUnique({
    where: { id: comboId },
  });

  if (!combo) {
    throw new Error('Combo no encontrado');
  }
  const total = unitPrice * quantity;

  // Crear la orden y vincular el combo
  return this.prisma.order.create({
    data: {
      id,
      userId: userId ?? null,
      eventId: combo.eventId,
      year,
      total,
      status: 'pending',
      paymentType,
      metadataToken,
      combos: {
        connect: [{ id: comboId }],
      },
    },
  });
}

  async updateOrder(
    orderId: string,
    comboId: string,
    paymentType: PaymentType,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { combos: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const combo = await this.prisma.combo.findUnique({
      where: { id: comboId },
    });

    if (!combo) {
      throw new BadRequestException('El combo no existe');
    }

    const total = combo.price * combo.minPersons;

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        total,
        paymentType,
        combos: {
          set: [],
          connect: { id: comboId },
        },
      },
    });
  }

}
