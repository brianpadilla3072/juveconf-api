/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/invitees/invitees.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FilterInviteesDto } from './DTOs';

@Injectable()
export class InviteesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterInviteesDto) {
    const year = filter.year ?? new Date().getFullYear();

    return this.prisma.invitee.findMany({
        where: {
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
}
