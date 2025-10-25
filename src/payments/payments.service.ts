/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { PrismaService } from '../../prisma/prisma.service';
import { 
  Injectable, 
  NotFoundException, 
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { CreatePaymentDto, UpdatePaymentDto } from './DTOs';
import { DashboardFilterDto } from './DTOs/dashboard-filter.dto';
import { PaymentType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        ...createPaymentDto,
      },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const existingPayment = await this.findOne(id);
    return this.prisma.payment.update({
      where: { id: existingPayment.id },
      data: updatePaymentDto,
    });
  }

  async remove(id: string) {
    const existingPayment = await this.findOne(id);
    return this.prisma.payment.update({
      where: { id: existingPayment.id },
      data: { deletedAt: new Date() },
    });
  }

  async getPaymentWithInvitees(paymentId: string): Promise<{ token: string , invitees: any[]}> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              invitees: true
            }
          }
        }
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${paymentId} not found`);
      }

      const paymentData = {
        ...payment,
        invitees: payment.order?.invitees || []
      };

      // Create a token with the payment data using signMetadata
      const token = this.jwtService.signMetadata(paymentData);

      return { token, invitees: payment.order?.invitees || [] };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error getting payment with invitees: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Error retrieving payment data');
    }
  }

  // Dashboard endpoints
  async getDashboardSummary(filters?: DashboardFilterDto) {
    console.log('[getDashboardSummary] Filtros recibidos:', filters);
    
    const whereClause: any = {
      deletedAt: null,
    };

    // Aplicar filtros
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters?.paymentType) {
      whereClause.type = filters.paymentType;
    }

    if (filters?.year) {
      whereClause.year = parseInt(filters.year);
    }

    if (filters?.eventId) {
      whereClause.order = {
        eventId: filters.eventId
      };
    }

    try {
      // Total de todos los payments
      const totalPayments = await this.prisma.payment.aggregate({
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Payments por tipo
      const paymentsByType = await this.prisma.payment.groupBy({
        by: ['type'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Payments por mes (últimos 12 meses)
      const paymentsByMonthRaw = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          SUM(amount) as total_amount,
          COUNT(*) as count
        FROM "Payment"
        WHERE "deletedAt" IS NULL
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `;

      // Convert BigInt values to numbers
      const paymentsByMonth = (paymentsByMonthRaw as any[]).map(row => ({
        ...row,
        total_amount: row.total_amount ? Number(row.total_amount) : 0,
        count: row.count ? Number(row.count) : 0,
      }));

      // Top eventos con más ingresos
      const topEventsByRevenue = await this.prisma.payment.groupBy({
        by: ['orderId'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 5,
      });

      // Obtener información de eventos para el top
      const eventIds = topEventsByRevenue.map(p => p.orderId);
      const eventDetails = await this.prisma.order.findMany({
        where: {
          id: { in: eventIds },
        },
        include: {
          event: {
            select: {
              id: true,
              topic: true,
              year: true,
            }
          }
        }
      });

      const topEventsWithDetails = topEventsByRevenue.map(payment => {
        const orderDetail = eventDetails.find(order => order.id === payment.orderId);
        return {
          ...payment,
          event: orderDetail?.event || null,
          orderId: payment.orderId
        };
      });

      console.log('[getDashboardSummary] Resumen calculado exitosamente');
      
      return {
        summary: {
          totalAmount: totalPayments._sum.amount || 0,
          totalCount: totalPayments._count.id || 0,
        },
        byType: paymentsByType.map(type => ({
          paymentType: type.type,
          totalAmount: type._sum.amount || 0,
          count: type._count.id || 0,
        })),
        byMonth: paymentsByMonth,
        topEvents: topEventsWithDetails,
      };
    } catch (error) {
      console.error('[getDashboardSummary] Error:', error);
      throw new InternalServerErrorException('Error al obtener resumen del dashboard');
    }
  }

  async getPaymentsByType(paymentType?: PaymentType) {
    const whereClause: any = {
      deletedAt: null,
    };

    if (paymentType) {
      whereClause.type = paymentType;
    }

    return await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            event: {
              select: {
                id: true,
                topic: true,
                year: true,
              }
            },
            combo: {
              select: {
                id: true,
                name: true,
                price: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPaymentsByDateRange(startDate: string, endDate: string) {
    const whereClause = {
      deletedAt: null,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    return await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            event: {
              select: {
                id: true,
                topic: true,
                year: true,
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRecentPayments(limit: number = 10) {
    return await this.prisma.payment.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        order: {
          include: {
            event: {
              select: {
                id: true,
                topic: true,
                year: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getPaymentStatistics() {
    try {
      // Estadísticas generales
      const totalStats = await this.prisma.payment.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
      });

      // Estadísticas por año
      const statsByYear = await this.prisma.payment.groupBy({
        by: ['year'],
        where: { deletedAt: null },
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
        orderBy: { year: 'desc' },
      });

      // Estadísticas por tipo de pago
      const statsByType = await this.prisma.payment.groupBy({
        by: ['type'],
        where: { deletedAt: null },
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
      });

      // Crecimiento mensual (últimos 6 meses)
      const monthlyGrowthRaw = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          SUM(amount) as total_amount,
          COUNT(*) as count,
          AVG(amount) as avg_amount
        FROM "Payment"
        WHERE "deletedAt" IS NULL
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `;

      // Convert BigInt values to numbers
      const monthlyGrowth = (monthlyGrowthRaw as any[]).map(row => ({
        ...row,
        total_amount: row.total_amount ? Number(row.total_amount) : 0,
        count: row.count ? Number(row.count) : 0,
        avg_amount: row.avg_amount ? Number(row.avg_amount) : 0,
      }));

      return {
        total: {
          amount: totalStats._sum.amount || 0,
          count: totalStats._count.id || 0,
          average: totalStats._avg.amount || 0,
        },
        byYear: statsByYear,
        byType: statsByType,
        monthlyGrowth,
      };
    } catch (error) {
      console.error('[getPaymentStatistics] Error:', error);
      throw new InternalServerErrorException('Error al obtener estadísticas de pagos');
    }
  }

  async getPaymentsEmails() {
    try {
      const payments = await this.prisma.payment.findMany({
        where: {
          deletedAt: null,
          AND: [
            { payerEmail: { not: null } },
            { payerEmail: { not: '' } },
          ],
        },
        select: {
          id: true,
          payerName: true,
          payerEmail: true,
          amount: true,
          type: true,
          year: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Eliminar emails duplicados usando Map
      const uniqueEmails = new Map();
      payments.forEach(payment => {
        if (!uniqueEmails.has(payment.payerEmail)) {
          uniqueEmails.set(payment.payerEmail, {
            email: payment.payerEmail,
            name: payment.payerName || 'Sin nombre',
            id: payment.id,
            paymentInfo: {
              amount: payment.amount,
              type: payment.type,
              year: payment.year,
              createdAt: payment.createdAt,
            },
          });
        }
      });

      const uniqueEmailsArray = Array.from(uniqueEmails.values());

      return {
        emails: uniqueEmailsArray,
        total: uniqueEmailsArray.length,
      };
    } catch (error) {
      console.error('[getPaymentsEmails] Error:', error);
      throw new InternalServerErrorException('Error al obtener emails de pagos');
    }
  }
}