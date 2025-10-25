/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { CreateEventDto, UpdateEventDto } from "./DTOs";
import { EventDaysSchema } from "./schemas/event-days.schema";
import { ZodError } from 'zod';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  /**
   * Genera automáticamente el array de días del evento basado en las fechas de inicio y fin
   * @param startDate - Fecha de inicio del evento
   * @param endDate - Fecha de fin del evento
   * @returns Objeto JSON con estructura { days: [...], totalDays: N } validado con Zod
   */
  private generateEventDays(startDate: Date, endDate: Date) {
    const days: Array<{
      date: string;
      dayNumber: number;
      label?: string;
      type?: string;
    }> = [];
    const currentDate = new Date(startDate);
    let dayNumber = 1;

    // Iterar desde startDate hasta endDate (inclusive)
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

      days.push({
        date: dateString,
        dayNumber,
        label: `Día ${dayNumber}`,
        type: 'general' // Puede ser: plenaria, talleres, general, etc.
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }

    const eventDays = {
      days,
      totalDays: days.length
    };

    // Validar con Zod antes de retornar
    try {
      return EventDaysSchema.parse(eventDays);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Invalid event days structure',
          errors: error.issues
        });
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.event.findMany({
      where: { deletedAt: null },
      include: {
        combos: {
          where: { deletedAt: null, isActive: true },
          orderBy: { displayOrder: 'asc' }
        },
        preSales: {
          where: { deletedAt: null },
          include: {
            comboPrices: {
              include: {
                combo: true
              }
            }
          }
        }
      }
    });
  }

  findById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        combos: {
          where: { deletedAt: null },
          orderBy: { displayOrder: 'asc' }
        },
        preSales: {
          where: { deletedAt: null },
          include: {
            comboPrices: {
              include: {
                combo: true
              }
            }
          }
        }
      }
    });
  }

  findByYear(year: number) {
    return this.prisma.event.findFirst({
      where: { year, deletedAt: null },
      include: {
        combos: {
          where: { deletedAt: null, isActive: true },
          orderBy: { displayOrder: 'asc' }
        },
        preSales: {
          where: { deletedAt: null },
          include: {
            comboPrices: {
              include: {
                combo: true
              }
            }
          }
        }
      }
    });
  }

  create(data: CreateEventDto) {
    // Si se proporcionan eventStartDate y eventEndDate, generar automáticamente eventDays
    let eventDays: any = null;

    if (data.eventStartDate && data.eventEndDate) {
      const startDate = new Date(data.eventStartDate);
      const endDate = new Date(data.eventEndDate);

      // Validar que la fecha de fin sea posterior o igual a la de inicio
      if (endDate >= startDate) {
        eventDays = this.generateEventDays(startDate, endDate);
      }
    }

    // Convertir strings de fecha a objetos Date
    const processedData: any = {
      ...data,
      salesStartDate: new Date(data.salesStartDate),
    };

    if (data.salesEndDate) {
      processedData.salesEndDate = new Date(data.salesEndDate);
    }
    if (data.eventStartDate) {
      processedData.eventStartDate = new Date(data.eventStartDate);
    }
    if (data.eventEndDate) {
      processedData.eventEndDate = new Date(data.eventEndDate);
    }

    return this.prisma.event.create({
      data: {
        ...processedData,
        eventDays: eventDays as any
      }
    });
  }

  async update(id: string, data: UpdateEventDto) {
    // Si se actualizan las fechas del evento, regenerar eventDays
    let eventDays = undefined;

    if (data.eventStartDate || data.eventEndDate) {
      // Obtener el evento actual para tener las fechas completas
      const currentEvent = await this.prisma.event.findUnique({
        where: { id },
        select: { eventStartDate: true, eventEndDate: true }
      });

      const startDate = data.eventStartDate
        ? new Date(data.eventStartDate)
        : currentEvent?.eventStartDate ? new Date(currentEvent.eventStartDate) : null;

      const endDate = data.eventEndDate
        ? new Date(data.eventEndDate)
        : currentEvent?.eventEndDate ? new Date(currentEvent.eventEndDate) : null;

      // Si tenemos ambas fechas, generar días
      if (startDate && endDate && endDate >= startDate) {
        eventDays = this.generateEventDays(startDate, endDate) as any;
      }
    }

    // Convertir strings de fecha a objetos Date
    const processedData: any = { ...data };

    if (data.salesStartDate) {
      processedData.salesStartDate = new Date(data.salesStartDate);
    }
    if (data.salesEndDate) {
      processedData.salesEndDate = new Date(data.salesEndDate);
    }
    if (data.eventStartDate) {
      processedData.eventStartDate = new Date(data.eventStartDate);
    }
    if (data.eventEndDate) {
      processedData.eventEndDate = new Date(data.eventEndDate);
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...processedData,
        ...(eventDays !== undefined && { eventDays })
      },
    });
  }

  remove(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
