/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Combo } from '@prisma/client';
import { CreateComboDto } from './DTOs/create-combo.dto';
import { UpdateComboDto } from './DTOs/update-combo.dto';

@Injectable()
export class CombosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateComboDto): Promise<Combo> {
    return this.prisma.combo.create({ data: dto });
  }

  async findAll(): Promise<Combo[]> {
    return this.prisma.combo.findMany();
  }

  async findOne(id: number): Promise<Combo> {
    const combo = await this.prisma.combo.findUnique({ where: { id } });
    if (!combo) throw new NotFoundException('Combo not found');
    return combo;
  }

  async update(id: number, dto: UpdateComboDto): Promise<Combo> {
    return this.prisma.combo.update({ where: { id }, data: dto });
  }

  async remove(id: number): Promise<Combo> {
    return this.prisma.combo.delete({ where: { id } });
  }
}

