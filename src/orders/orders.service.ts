/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) {}
    async createOrder(userId: number, comboIds: number[]) {
        // Calcular total sumando precios de los combos
        const combos = await this.prisma.combo.findMany({ where: { id: { in: comboIds } } });
        const total = combos.reduce((sum, c) => sum + c.price, 0);
        return this.prisma.order.create({
          data: {
            userId,
            total,
            combos: { connect: comboIds.map(id => ({ id })) },
            status: 'pending',
          },
        });
      }
      
}
