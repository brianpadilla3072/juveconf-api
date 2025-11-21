// src/invitees/invitees.service.ts
/* eslint-disable prettier/prettier */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FilterInviteesDto, CreateInviteeDto, UpdateInviteeDto } from './DTOs';
import { AttendanceSchema } from './schemas/attendance.schema';
import { ZodError } from 'zod';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class InviteesService {
  constructor(private readonly prisma: PrismaService) {}

  private parseInviteeMetadata(metadata: string | null) {
    if (!metadata) return null;
    
    try {
      const parsed = JSON.parse(metadata);
      return {
        email: parsed.email || null,
        phone: parsed.phone || null,
        birthdate: parsed.birthdate || null,
        city: parsed.city || null,
        church: parsed.church || null,
        merchandiseSizes: parsed.merchandiseSizes || {}
      };
    } catch (error) {
      console.warn('Error parsing invitee metadata:', error);
      return null;
    }
  }

  private transformInviteeResponse(invitee: any) {
    return {
      ...invitee,
      parsedMetadata: this.parseInviteeMetadata(invitee.metadata)
    };
  }

  async findAll(filter: FilterInviteesDto) {
    const year = filter.year ?? new Date().getFullYear();

    // Build Order filter if eventId or comboId/comboIds provided
    const orderFilter: any = {};
    if (filter.eventId) {
      orderFilter.eventId = filter.eventId;
    }

    // Support for multiple comboIds (new) or single comboId (backward compatibility)
    if (filter.comboIds && filter.comboIds.length > 0) {
      orderFilter.comboId = { in: filter.comboIds };
    } else if (filter.comboId) {
      orderFilter.comboId = filter.comboId;
    }

    const whereClause: any = {
      deletedAt: null,
      Payment: {
        is: {
          year: year,
          // Filter through Payment->Order relation (nested inside Payment)
          ...(filter.eventId || filter.comboId || filter.comboIds ? {
            Order: {
              is: orderFilter
            }
          } : {})
        },
      },
    };

    const invitees = await this.prisma.invitee.findMany({
      where: whereClause,
      include: {
        Payment: {
          include: {
            Order: true
          }
        },
        Order: true,
      },
    });

    return invitees.map(invitee => this.transformInviteeResponse(invitee));
  }

  async findOne(id: string) {
    const invitee = await this.prisma.invitee.findUnique({
      where: { id },
      include: {
        Payment: {
          include: {
            Order: {
              include: {
                Event: {
                  select: {
                    id: true,
                    topic: true,
                    eventDays: true,
                    eventStartDate: true,
                  }
                }
              }
            }
          }
        },
        Order: {
          include: {
            Event: {
              select: {
                id: true,
                topic: true,
                eventDays: true,
                eventStartDate: true,
              }
            }
          }
        },
      },
    });

    if (!invitee || invitee.deletedAt) {
      throw new NotFoundException('Invitee not found');
    }

    return this.transformInviteeResponse(invitee);
  }

  async search(query: string, eventId?: string) {
    const whereClause: any = {
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { cuil: { contains: query, mode: 'insensitive' } },
        {
          AND: [
            { email: { not: null } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
      ],
    };

    if (eventId) {
      whereClause.Payment = {
        Order: {
          eventId: eventId,
        },
      };
    }

    const invitees = await this.prisma.invitee.findMany({
      where: whereClause,
      include: {
        Payment: {
          select: {
            id: true,
            amount: true,
            payerEmail: true,
            Order: {
              select: {
                id: true,
                eventId: true,
                Event: {
                  select: {
                    id: true,
                    eventDays: true,
                    eventStartDate: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    return invitees.map(invitee => this.transformInviteeResponse(invitee));
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
   * Marca asistencia de un invitado para un día específico
   */
  async markAttendanceByDay(
    id: string,
    data: { dayNumber: number; attended: boolean; notes?: string }
  ) {
    const invitee = await this.prisma.invitee.findUnique({
      where: { id },
      include: {
        Order: {
          include: {
            Event: { select: { eventStartDate: true, eventDays: true } }
          }
        },
        Payment: {
          include: {
            Order: {
              include: {
                Event: { select: { eventStartDate: true, eventDays: true } }
              }
            }
          }
        }
      }
    });

    if (!invitee || invitee.deletedAt) {
      throw new NotFoundException('Invitee not found or deleted');
    }

    const event = invitee.Order?.Event || invitee.Payment?.Order?.Event;
    if (!event) {
      throw new BadRequestException('No event associated with this invitee');
    }

    const eventDays = (event.eventDays as any);
    if (!eventDays || typeof eventDays !== 'object') {
      throw new BadRequestException('Event has no days configured');
    }

    if (!event.eventStartDate) {
      throw new BadRequestException('Event has no start date configured');
    }

    // Calcular fecha del día
    const eventDate = new Date(event.eventStartDate);
    eventDate.setDate(eventDate.getDate() + (data.dayNumber - 1));

    const currentAttendance = (invitee.attendance as any) || { days: {} };
    if (!currentAttendance.days) {
      currentAttendance.days = {};
    }
    currentAttendance.days[data.dayNumber.toString()] = {
      attended: data.attended,
      timestamp: new Date().toISOString(),
      ...(data.notes && { notes: data.notes }),
      metadata: {
        eventDate: eventDate.toISOString().split('T')[0],
        dayLabel: `Día ${data.dayNumber}`
      }
    };

    try {
      AttendanceSchema.parse(currentAttendance);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Invalid attendance data',
          errors: error.issues
        });
      }
      throw error;
    }

    return this.prisma.invitee.update({
      where: { id },
      data: { attendance: currentAttendance },
    });
  }

  /**
   * Marca asistencia para múltiples días en una sola operación (batch)
   */
  async markAttendanceMultipleDays(
    id: string,
    data: { days: Array<{ dayNumber: number; attended: boolean }>; notes?: string }
  ) {
    const invitee = await this.prisma.invitee.findUnique({
      where: { id },
      include: {
        Order: {
          include: {
            Event: { select: { eventStartDate: true, eventDays: true } }
          }
        },
        Payment: {
          include: {
            Order: {
              include: {
                Event: { select: { eventStartDate: true, eventDays: true } }
              }
            }
          }
        }
      }
    });

    if (!invitee || invitee.deletedAt) {
      throw new NotFoundException('Invitee not found or deleted');
    }

    const event = invitee.Order?.Event || invitee.Payment?.Order?.Event;
    if (!event) {
      throw new BadRequestException('No event associated with this invitee');
    }

    const eventDays = (event.eventDays as any);
    if (!eventDays || typeof eventDays !== 'object') {
      throw new BadRequestException('Event has no days configured');
    }

    if (!event.eventStartDate) {
      throw new BadRequestException('Event has no start date configured');
    }

    const currentAttendance = (invitee.attendance as any) || { days: {} };
    if (!currentAttendance.days) {
      currentAttendance.days = {};
    }

    // Actualizar todos los días en memoria
    for (const day of data.days) {
      const eventDate = new Date(event.eventStartDate);
      eventDate.setDate(eventDate.getDate() + (day.dayNumber - 1));

      currentAttendance.days[day.dayNumber.toString()] = {
        attended: day.attended,
        timestamp: new Date().toISOString(),
        ...(data.notes && { notes: data.notes }),
        metadata: {
          eventDate: eventDate.toISOString().split('T')[0],
          dayLabel: `Día ${day.dayNumber}`
        }
      };
    }

    try {
      AttendanceSchema.parse(currentAttendance);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Invalid attendance data',
          errors: error.issues
        });
      }
      throw error;
    }

    return this.prisma.invitee.update({
      where: { id },
      data: { attendance: currentAttendance },
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
      Payment: {
        is: {
          year: year,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      Payment: {
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
        paymentInfo: invitee.Payment,
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
        Order: {
          select: {
            eventId: true
          }
        }
      }
    });
  }

  /**
   * Extrae información del attendee desde el metadata token de la orden
   */
  private extractAttendeeInfoFromOrderToken(order: any, inviteeCuil: string, inviteeName: string) {
    if (!order?.metadataToken) return null;

    try {
      const secret = process.env.MP_WEBHOOK_SECRET || 'juveconf-metadata-secret-key-2025';
      const decoded = jwt.verify(order.metadataToken, secret) as any;
      
      if (!decoded.attendees) return null;
      
      // Estrategia 1: Buscar por CUIL exacto
      let attendee = decoded.attendees.find((att: any) => att.cuil === inviteeCuil);
      
      // Estrategia 2: Si no se encuentra por CUIL, buscar por nombre
      if (!attendee) {
        attendee = decoded.attendees.find((att: any) => 
          att.name?.trim().toLowerCase() === inviteeName?.trim().toLowerCase()
        );
      }
      
      // Estrategia 3: Si solo hay un attendee, usar ese
      if (!attendee && decoded.attendees.length === 1) {
        attendee = decoded.attendees[0];
      }
      
      if (attendee?.metadata) {
        try {
          return JSON.parse(attendee.metadata);
        } catch (error) {
          console.warn('Error parsing attendee metadata from token:', error);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error decoding order metadata token:', error);
      return null;
    }
  }

  /**
   * Obtiene información completa del combo asociado a un invitado
   * Maneja múltiples rutas de acceso: Order->Combo, Payment->Order->Combo, orderSnapshot
   */
  async getComboInfoForInvitee(inviteeId: string) {
    // Buscar el invitado con todas las relaciones necesarias
    const invitee = await this.prisma.invitee.findUnique({
      where: { id: inviteeId },
      include: {
        Order: {
          include: {
            Combo: true
          }
        },
        Payment: {
          include: {
            Order: {
              include: {
                Combo: true
              }
            }
          }
        }
      }
    });

    if (!invitee) {
      throw new NotFoundException('Invitee not found');
    }

    let combo: any = null;
    let orderSnapshot: any = null;
    let orderForToken: any = null;

    // Estrategia 1: Obtener combo directamente desde la Order del invitado
    if (invitee.Order?.Combo) {
      combo = invitee.Order.Combo;
      orderSnapshot = invitee.Order.orderSnapshot;
      orderForToken = invitee.Order;
    }
    // Estrategia 2: Obtener combo desde Payment->Order->Combo
    else if (invitee.Payment?.Order?.Combo) {
      combo = invitee.Payment.Order.Combo;
      orderSnapshot = invitee.Payment.Order.orderSnapshot;
      orderForToken = invitee.Payment.Order;
    }

    // Si no hay combo disponible, retornar información de que no hay combo
    if (!combo) {
      return {
        hasCombo: false,
        message: 'No se encontró información del combo para este invitado'
      };
    }

    // Extraer beneficios del metadata
    let benefits: string[] = [];
    let merchandise = null;
    
    try {
      if (combo.metadata && typeof combo.metadata === 'object') {
        benefits = combo.metadata.benefits || [];
        merchandise = combo.metadata.merchandise || null;
      }
    } catch (error) {
      console.warn('Error parsing combo metadata:', error);
    }

    // Si no hay beneficios en metadata, intentar obtenerlos del orderSnapshot
    if (benefits.length === 0 && orderSnapshot?.combo?.benefits) {
      benefits = orderSnapshot.combo.benefits;
    }

    // Extraer información del attendee desde el metadata token
    const attendeeInfo = this.extractAttendeeInfoFromOrderToken(orderForToken, invitee.cuil, invitee.name);
    
    // Enriquecer merchandise con información de tallas seleccionadas
    if (merchandise && attendeeInfo?.merchandiseSizes) {
      (merchandise as any).selectedSizes = attendeeInfo.merchandiseSizes;
    }

    return {
      hasCombo: true,
      id: combo.id,
      name: combo.name,
      price: combo.price,
      description: combo.description,
      isFree: combo.isFree,
      personsIncluded: combo.personsIncluded,
      benefits: benefits,
      merchandise: merchandise,
      // Información adicional del attendee desde el token
      attendeeInfo: attendeeInfo,
      // Información adicional del snapshot si está disponible
      snapshotInfo: orderSnapshot?.combo ? {
        appliedPrice: orderSnapshot.combo.appliedPrice,
        basePrice: orderSnapshot.combo.basePrice,
        preSaleInfo: orderSnapshot.preSale || null
      } : null
    };
  }
}
