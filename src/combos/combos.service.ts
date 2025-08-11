/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Combo } from '@prisma/client';
import { CreateComboDto } from './DTOs/create-combo.dto';
import { UpdateComboDto } from './DTOs/update-combo.dto';

@Injectable()
export class CombosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateComboDto): Promise<Combo> {
    // Verificar si ya existe un combo con el mismo nombre y año
    const existingCombo = await this.prisma.combo.findFirst({
      where: {
        name: dto.name,
        year: dto.year,
        deletedAt: null,
      },
    });

    if (existingCombo) {
      throw new ConflictException(`Ya existe un combo con el nombre "${dto.name}" para el año ${dto.year}`);
    }

    // Verificar si el evento existe
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    return this.prisma.combo.create({ 
      data: {
        ...dto,
        year: dto.year || new Date().getFullYear(),
      },
    });
  }

  async findAll(): Promise<Combo[]> {
    return this.prisma.combo.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            topic: true,
            year: true,
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { price: 'asc' },
      ],
    });
  }

  async findOne(id: string): Promise<Combo> {
    const combo = await this.prisma.combo.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            topic: true,
            year: true,
            capacity: true,
            salesStartDate: true,
          }
        },
        orders: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          }
        }
      }
    });
    if (!combo) throw new NotFoundException('Combo no encontrado');
    return combo;
  }

  async update(id: string, dto: UpdateComboDto): Promise<Combo> {
    // Verificar si el combo existe
    const existingCombo = await this.findOne(id);
    
    // Si se está actualizando el nombre o año, verificar duplicados
    if (dto.name || dto.year) {
      const conflictCombo = await this.prisma.combo.findFirst({
        where: {
          name: dto.name || existingCombo.name,
          year: dto.year || existingCombo.year,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (conflictCombo) {
        throw new ConflictException(`Ya existe otro combo con el nombre "${dto.name || existingCombo.name}" para el año ${dto.year || existingCombo.year}`);
      }
    }

    return this.prisma.combo.update({ 
      where: { id }, 
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string): Promise<Combo> {
    // Verificar si el combo existe
    await this.findOne(id);
    
    // Verificar si tiene órdenes asociadas
    const ordersCount = await this.prisma.order.count({
      where: {
        combos: {
          some: { id },
        },
      },
    });

    if (ordersCount > 0) {
      // Soft delete si tiene órdenes asociadas
      return this.prisma.combo.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Hard delete si no tiene órdenes asociadas
    return this.prisma.combo.delete({ where: { id } });
  }

  // Endpoints adicionales
  async findByEvent(eventId: string): Promise<Combo[]> {
    return this.prisma.combo.findMany({
      where: {
        eventId,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            topic: true,
            year: true,
          }
        }
      },
      orderBy: { price: 'asc' },
    });
  }

  async findByYear(year: number): Promise<Combo[]> {
    return this.prisma.combo.findMany({
      where: {
        year,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            topic: true,
            year: true,
          }
        }
      },
      orderBy: { price: 'asc' },
    });
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Combo[]> {
    return this.prisma.combo.findMany({
      where: {
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            topic: true,
            year: true,
          }
        }
      },
      orderBy: { price: 'asc' },
    });
  }

  async getComboStatistics(): Promise<any> {
    const stats = await this.prisma.combo.aggregate({
      where: { deletedAt: null },
      _count: { id: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
    });

    const combosByYear = await this.prisma.combo.groupBy({
      by: ['year'],
      where: { deletedAt: null },
      _count: { id: true },
      _avg: { price: true },
      orderBy: { year: 'desc' },
    });

    const combosByEvent = await this.prisma.combo.groupBy({
      by: ['eventId'],
      where: { deletedAt: null },
      _count: { id: true },
      _avg: { price: true },
    });

    // Obtener información de eventos para el agrupado
    const eventIds = combosByEvent.map(c => c.eventId);
    const eventDetails = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, topic: true, year: true },
    });

    const combosByEventWithDetails = combosByEvent.map(combo => {
      const eventDetail = eventDetails.find(e => e.id === combo.eventId);
      return {
        ...combo,
        event: eventDetail,
      };
    });

    return {
      total: stats,
      byYear: combosByYear,
      byEvent: combosByEventWithDetails,
    };
  }

  async searchCombos(query: string): Promise<Combo[]> {
    return this.prisma.combo.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            topic: true,
            year: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });
  }
}

