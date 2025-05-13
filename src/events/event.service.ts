/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { CreateEventDto, UpdateEventDto } from "./DTOs";

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.event.findMany({
      where: { deletedAt: null },
    });
  }

  findById(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  findByYear(year: number) {
    return this.prisma.event.findFirst({
      where: { year, deletedAt: null },
    });
  }

  create(data: CreateEventDto) {
    return this.prisma.event.create({ data });
  }

  update(id: string, data: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data,
    });
  }
}
