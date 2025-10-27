/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePreSaleDto } from './DTOs/create-presale.dto';
import { UpdatePreSaleDto } from './DTOs/update-presale.dto';

@Injectable()
export class PresalesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePreSaleDto) {
    // Verificar si el evento existe
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    // Verificar si ya existe una preventa con el mismo nombre para este evento
    const existing = await this.prisma.preSale.findFirst({
      where: {
        eventId: dto.eventId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una preventa con el nombre "${dto.name}" para este evento`);
    }

    // Crear preventa con precios
    return this.prisma.preSale.create({
      data: {
        eventId: dto.eventId,
        name: dto.name,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
        PreSaleComboPrice: {
          create: dto.comboPrices.map(cp => ({
            comboId: cp.comboId,
            price: cp.price,
          })),
        },
      },
      include: {
        PreSaleComboPrice: {
          include: {
            Combo: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.preSale.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        Event: true,
        PreSaleComboPrice: {
          include: {
            Combo: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.preSale.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        Event: true,
        PreSaleComboPrice: {
          include: {
            Combo: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const preSale = await this.prisma.preSale.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        Event: true,
        PreSaleComboPrice: {
          include: {
            Combo: true,
          },
        },
      },
    });

    if (!preSale) {
      throw new NotFoundException('Preventa no encontrada');
    }

    return preSale;
  }

  async update(id: string, dto: UpdatePreSaleDto) {
    await this.findOne(id); // Verificar que existe

    const updateData: any = {
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive,
      updatedAt: new Date(),
    };

    // Si se actualizan los precios, primero eliminar los existentes
    if (dto.comboPrices) {
      await this.prisma.preSaleComboPrice.deleteMany({
        where: { preSaleId: id },
      });

      updateData.PreSaleComboPrice = {
        create: dto.comboPrices.map(cp => ({
          comboId: cp.comboId,
          price: cp.price,
        })),
      };
    }

    return this.prisma.preSale.update({
      where: { id },
      data: updateData,
      include: {
        PreSaleComboPrice: {
          include: {
            Combo: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.preSale.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Método útil: Obtener precio actual de un combo
  async getCurrentPriceForCombo(comboId: string) {
    const now = new Date();

    const preSalePrice = await this.prisma.preSaleComboPrice.findFirst({
      where: {
        comboId,
        PreSale: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          deletedAt: null,
        },
      },
      include: {
        PreSale: true,
      },
    });

    if (preSalePrice) {
      return {
        price: preSalePrice.price,
        preSaleName: preSalePrice.PreSale.name,
        preSaleId: preSalePrice.PreSale.id,
        isPreSale: true,
      };
    }

    // Si no hay preventa activa, retornar null
    return null;
  }
}
