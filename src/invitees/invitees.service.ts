// src/invitees/invitees.service.ts
/* eslint-disable prettier/prettier */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FilterInviteesDto, CreateInviteeDto, UpdateInviteeDto } from './DTOs';
import { AttendanceSchema } from './schemas/attendance.schema';
import { ZodError } from 'zod';

@Injectable()
export class InviteesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterInviteesDto) {
    const year = filter.year ?? new Date().getFullYear();

    return this.prisma.invitee.findMany({
      where: {
        deletedAt: null,
        payment: {
          is: {
            year: year,
          },
        },
      },
      include: {
        payment: true,
        order: true,
      },
    });
  }

  async findOne(id: string) {
    const invitee = await this.prisma.invitee.findUnique({
      where: { id },
      include: {
        payment: true,
        order: true,
      },
    });

    if (!invitee || invitee.deletedAt) {
      throw new NotFoundException('Invitee not found');
    }

    return invitee;
  }

  async create(data: CreateInviteeDto) {
    return this.prisma.invitee.create({
      data,
    });
  }

  async update(id: string, data: UpdateInviteeDto) {
    const invitee = await this.prisma.invitee.findUnique({ where: { id } });

    if (!invitee || invitee.deletedAt) {
      throw new NotFoundException('Invitee not found');
    }

    return this.prisma.invitee.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const invitee = await this.prisma.invitee.findUnique({ where: { id } });

    if (!invitee || invitee.deletedAt) {
      throw new NotFoundException('Invitee not found or already deleted');
    }

    return this.prisma.invitee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  /**
   * Marca asistencia de un invitado para un día específico (sistema dinámico)
   * @param id - ID del invitado
   * @param data - { dayNumber: number, attended: boolean, notes?: string }
   */
  async markAttendanceByDay(
    id: string,
    data: { dayNumber: number; attended: boolean; notes?: string }
  ) {
    const invitee = await this.prisma.invitee.findUnique({ where: { id } });

    if (!invitee || invitee.deletedAt) {
      throw new NotFoundException('Invitee not found or deleted');
    }

    // Obtener attendance actual o crear estructura nueva
    const currentAttendance = (invitee.attendance as any) || { days: {} };

    // Actualizar el día específico
    currentAttendance.days[data.dayNumber.toString()] = {
      attended: data.attended,
      timestamp: new Date().toISOString(),
      ...(data.notes && { notes: data.notes })
    };

    // Validar con Zod antes de guardar
    try {
      AttendanceSchema.parse(currentAttendance);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Invalid attendance data structure',
          errors: error.issues
        });
      }
      throw error;
    }

    // Actualizar con el nuevo sistema de asistencia
    return this.prisma.invitee.update({
      where: { id },
      data: {
        attendance: currentAttendance
      },
    });
  }

async getInviteesEmails(filter: FilterInviteesDto) {
  const year = filter.year ?? new Date().getFullYear();

  const invitees = await this.prisma.invitee.findMany({
    where: {
      deletedAt: null,
      AND: [
        { email: { not: null } },
        { email: { not: '' } },
      ],
      payment: {
        is: {
          year: year,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      payment: {
        select: {
          id: true,
          amount: true,
          type: true,
        },
      },
    },
  });

  // Eliminar emails duplicados usando Map
  const uniqueEmails = new Map();
  invitees.forEach(invitee => {
    if (!uniqueEmails.has(invitee.email)) {
      uniqueEmails.set(invitee.email, {
        email: invitee.email,
        name: invitee.name,
        id: invitee.id,
        paymentInfo: invitee.payment,
      });
    }
  });

  const uniqueEmailsArray = Array.from(uniqueEmails.values());

  return {
    emails: uniqueEmailsArray,
    total: uniqueEmailsArray.length,
  };
}

  /**
   * Obtiene invitados por paymentId (endpoint público para descarga de entradas)
   * Incluye eventId obtenido desde la relación con Order
   */
  async findByPaymentId(paymentId: string) {
    return this.prisma.invitee.findMany({
      where: {
        paymentId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        cuil: true,
        email: true,
        phone: true,
        paymentId: true,
        order: {
          select: {
            eventId: true
          }
        }
      }
    });
  }
}
