/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/invitees/invitees.service.ts
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
}
