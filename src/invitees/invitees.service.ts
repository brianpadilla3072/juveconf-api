// src/invitees/invitees.service.ts
/* eslint-disable prettier/prettier */
 
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FilterInviteesDto, CreateInviteeDto, UpdateInviteeDto } from './DTOs';

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
  async markAttendance(id: string, data: { day1?: boolean; day2?: boolean }) {
  const invitee = await this.prisma.invitee.findUnique({ where: { id } });

  if (!invitee || invitee.deletedAt) {
    throw new NotFoundException('Invitee not found or deleted');
  }

  return this.prisma.invitee.update({
    where: { id },
    data: {
      attendedDay1: data.day1 ?? invitee.attendedDay1,
      attendedDay2: data.day2 ?? invitee.attendedDay2,
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
}
