import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(year: number, eventId?: string) {
    // Construir filtros dinámicos basados en eventId
    const paymentWhere: any = { year, deletedAt: null };
    const orderWhere: any = {
      year: year,
      status: { in: ['PENDING', 'REVIEW'] },
      paymentType: { not: 'MERCADOPAGO' },
      deletedAt: null
    };
    const eventWhere: any = { year, deletedAt: null };
    const inviteeWhere: any = { deletedAt: null };

    if (eventId) {
      // Filtrar payments por eventId (a través de order)
      paymentWhere.order = { eventId };
      // Filtrar orders por eventId
      orderWhere.eventId = eventId;
      // Filtrar event específico
      eventWhere.id = eventId;
      // Filtrar invitees por eventId (a través de order)
      inviteeWhere.order = { eventId };
    }

    // KPIs principales
    const [
      totalRevenue,
      pendingOrders,
      activeEvents,
      totalAttendees,
      totalCapacity,
      previousYearRevenue,
      totalUsers
    ] = await Promise.all([
      // Ingresos totales del año/evento
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Órdenes pendientes (excluyendo MercadoPago)
      this.prisma.order.count({
        where: orderWhere
      }),

      // Eventos activos
      this.prisma.event.count({
        where: eventWhere
      }),

      // Total de invitados registrados
      this.prisma.invitee.count({
        where: inviteeWhere
      }),

      // Capacidad total de eventos
      this.prisma.event.aggregate({
        where: eventWhere,
        _sum: { capacity: true }
      }),

      // Ingresos año anterior para comparación
      this.prisma.payment.aggregate({
        where: eventId ? {
          ...paymentWhere,
          year: year - 1
        } : {
          year: year - 1,
          deletedAt: null
        },
        _sum: { amount: true }
      }),

      // Total usuarios registrados
      this.prisma.user.count({
        where: { deletedAt: null }
      })
    ]);

    // Calcular asistencia desde JSON (sistema dinámico)
    // Obtener todos los invitados para calcular asistencia
    const invitees = await this.prisma.invitee.findMany({
      where: inviteeWhere,
      select: { attendance: true }
    });

    // Calcular asistencias dinámicamente desde JSON
    let attendanceByDay: { [dayNumber: string]: number } = {};

    invitees.forEach(invitee => {
      const attendance = invitee.attendance as any;
      if (attendance && attendance.days) {
        Object.entries(attendance.days).forEach(([dayNumber, record]: [string, any]) => {
          if (record.attended) {
            attendanceByDay[dayNumber] = (attendanceByDay[dayNumber] || 0) + 1;
          }
        });
      }
    });

    const revenueCurrent = totalRevenue._sum.amount || 0;
    const revenuePrevious = previousYearRevenue._sum.amount || 0;
    const revenueGrowth = revenuePrevious > 0 ?
      ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100 : 0;

    const capacityUsed = totalCapacity._sum.capacity || 0;
    const capacityUtilization = capacityUsed > 0 ?
      (totalAttendees / capacityUsed) * 100 : 0;

    return {
      kpis: {
        totalRevenue: revenueCurrent,
        totalPayments: totalRevenue._count.id,
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        pendingOrders,
        activeEvents,
        totalAttendees,
        // Asistencias dinámicas por día
        attendanceByDay,
        capacityUtilization: Number(capacityUtilization.toFixed(2)),
        totalUsers
      },
      summary: {
        year,
        previousYear: year - 1,
        totalCapacity: capacityUsed,
        revenueComparison: {
          current: revenueCurrent,
          previous: revenuePrevious,
          growth: revenueGrowth
        }
      }
    };
  }

  async getRevenueTrends(months: number = 12, eventId?: string) {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    let revenueByMonthRaw: any[];

    if (eventId) {
      // Filtrar por eventId usando JOIN con Order
      revenueByMonthRaw = await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', p."createdAt") as month,
          SUM(p.amount) as total_amount,
          COUNT(*) as payment_count,
          AVG(p.amount) as avg_amount
        FROM "Payment" p
        INNER JOIN "Order" o ON p."orderId" = o.id
        WHERE p."deletedAt" IS NULL
          AND o."eventId" = ${eventId}
          AND p."createdAt" >= ${monthsAgo}
        GROUP BY DATE_TRUNC('month', p."createdAt")
        ORDER BY month ASC
      `;
    } else {
      // Sin filtro de evento
      revenueByMonthRaw = await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          SUM(amount) as total_amount,
          COUNT(*) as payment_count,
          AVG(amount) as avg_amount
        FROM "Payment"
        WHERE "deletedAt" IS NULL
          AND "createdAt" >= ${monthsAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `;
    }

    // Convertir BigInt a Number
    const revenueByMonth = (revenueByMonthRaw as any[]).map(row => ({
      month: row.month,
      totalAmount: Number(row.total_amount || 0),
      paymentCount: Number(row.payment_count || 0),
      avgAmount: Number(row.avg_amount || 0),
      monthName: new Date(row.month).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      })
    }));

    return {
      trends: revenueByMonth,
      summary: {
        totalMonths: months,
        totalRevenue: revenueByMonth.reduce((sum, month) => sum + month.totalAmount, 0),
        totalPayments: revenueByMonth.reduce((sum, month) => sum + month.paymentCount, 0),
        avgMonthlyRevenue: revenueByMonth.length > 0 
          ? revenueByMonth.reduce((sum, month) => sum + month.totalAmount, 0) / revenueByMonth.length 
          : 0
      }
    };
  }

  async getOrdersAnalytics(year: number, eventId?: string) {
    const orderWhere: any = { year, deletedAt: null };
    if (eventId) {
      orderWhere.eventId = eventId;
    }

    // Órdenes por estado
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where: orderWhere,
      _count: { id: true },
      _sum: { total: true }
    });

    // Órdenes por tipo de pago
    const ordersByPaymentType = await this.prisma.order.groupBy({
      by: ['paymentType'],
      where: orderWhere,
      _count: { id: true },
      _sum: { total: true }
    });

    // Tendencia de órdenes por día (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let ordersByDayRaw: any[];

    if (eventId) {
      ordersByDayRaw = await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', "createdAt") as day,
          COUNT(*) as order_count,
          SUM(total) as total_amount
        FROM "Order"
        WHERE "deletedAt" IS NULL
          AND "eventId" = ${eventId}
          AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `;
    } else {
      ordersByDayRaw = await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', "createdAt") as day,
          COUNT(*) as order_count,
          SUM(total) as total_amount
        FROM "Order"
        WHERE "deletedAt" IS NULL
          AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `;
    }

    const ordersByDay = (ordersByDayRaw as any[]).map(row => ({
      day: row.day,
      orderCount: Number(row.order_count || 0),
      totalAmount: Number(row.total_amount || 0),
      dayName: new Date(row.day).toLocaleDateString('es-ES', { 
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      })
    }));

    return {
      byStatus: ordersByStatus,
      byPaymentType: ordersByPaymentType,
      dailyTrend: ordersByDay,
      summary: {
        totalOrders: ordersByStatus.reduce((sum, status) => sum + status._count.id, 0),
        totalValue: ordersByStatus.reduce((sum, status) => sum + (status._sum.total || 0), 0),
        avgOrderValue: ordersByStatus.length > 0 
          ? ordersByStatus.reduce((sum, status) => sum + (status._sum.total || 0), 0) / 
            ordersByStatus.reduce((sum, status) => sum + status._count.id, 0)
          : 0
      }
    };
  }

  async getAttendanceAnalytics(year: number, eventId?: string) {
    // Asistencia por evento (calculada en aplicación, no SQL)
    const eventWhere: any = { year, deletedAt: null };
    if (eventId) {
      eventWhere.id = eventId;
    }

    const events = await this.prisma.event.findMany({
      where: eventWhere,
      include: {
        Order: {
          where: { deletedAt: null },
          include: {
            Invitee: {
              where: { deletedAt: null },
              select: { id: true, attendance: true }
            }
          }
        }
      }
    });

    const attendanceByEvent = events.map(event => {
      const invitees = event.Order.flatMap(order => order.Invitee);
      const totalInvitees = invitees.length;

      // Calcular asistencia por día desde JSON
      const attendanceByDay: { [dayNumber: string]: number } = {};

      invitees.forEach(invitee => {
        const attendance = invitee.attendance as any;
        if (attendance && attendance.days) {
          Object.entries(attendance.days).forEach(([dayNumber, record]: [string, any]) => {
            if (record.attended) {
              attendanceByDay[dayNumber] = (attendanceByDay[dayNumber] || 0) + 1;
            }
          });
        }
      });

      return {
        event_name: event.topic,
        total_invitees: totalInvitees,
        attendance_by_day: attendanceByDay,
        capacity: event.capacity
      };
    }).sort((a, b) => b.total_invitees - a.total_invitees);

    // Tendencia de registros por semana
    const registrationsByWeekRaw = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', i."createdAt") as week,
        COUNT(*) as registrations
      FROM "Invitee" i
      WHERE i."deletedAt" IS NULL
        AND i."createdAt" >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', i."createdAt")
      ORDER BY week ASC
    `;

    const attendanceData = attendanceByEvent.map(row => ({
      eventName: row.event_name,
      totalInvitees: row.total_invitees,
      attendanceByDay: row.attendance_by_day,
      capacity: row.capacity,
      utilizationRate: row.capacity > 0 ?
        (row.total_invitees / row.capacity) * 100 : 0
    }));

    const registrationTrend = (registrationsByWeekRaw as any[]).map(row => ({
      week: row.week,
      registrations: Number(row.registrations || 0),
      weekName: new Date(row.week).toLocaleDateString('es-ES', { 
        day: 'numeric',
        month: 'short'
      })
    }));

    // Calcular totales dinámicos por día
    const totalAttendanceByDay: { [dayNumber: string]: number } = {};
    attendanceData.forEach(event => {
      Object.entries(event.attendanceByDay).forEach(([dayNumber, count]) => {
        totalAttendanceByDay[dayNumber] = (totalAttendanceByDay[dayNumber] || 0) + (count as number);
      });
    });

    return {
      byEvent: attendanceData,
      registrationTrend,
      summary: {
        totalRegistrations: attendanceData.reduce((sum, event) => sum + event.totalInvitees, 0),
        totalAttendanceByDay,
        avgUtilization: attendanceData.length > 0
          ? attendanceData.reduce((sum, event) => sum + event.utilizationRate, 0) / attendanceData.length
          : 0
      }
    };
  }

  async getCombosRanking(year: number, limit: number = 10, eventId?: string) {
    let combosRankingRaw: any[];

    if (eventId) {
      combosRankingRaw = await this.prisma.$queryRaw`
        SELECT
          c."name" as combo_name,
          c."price",
          c."personsIncluded",
          COUNT(DISTINCT o.id) as order_count,
          SUM(o."total") as total_revenue,
          COUNT(i.id) as total_invitees
        FROM "Combo" c
        LEFT JOIN "Order" o ON c.id = o."comboId" AND o."deletedAt" IS NULL AND o."eventId" = ${eventId}
        LEFT JOIN "Invitee" i ON o.id = i."orderId" AND i."deletedAt" IS NULL
        WHERE c."eventId" = ${eventId} AND c."deletedAt" IS NULL
        GROUP BY c.id, c."name", c."price", c."personsIncluded"
        ORDER BY order_count DESC, total_revenue DESC
        LIMIT ${limit}
      `;
    } else {
      combosRankingRaw = await this.prisma.$queryRaw`
        SELECT
          c."name" as combo_name,
          c."price",
          c."personsIncluded",
          COUNT(DISTINCT o.id) as order_count,
          SUM(o."total") as total_revenue,
          COUNT(i.id) as total_invitees
        FROM "Combo" c
        LEFT JOIN "Event" e ON c."eventId" = e.id
        LEFT JOIN "Order" o ON c.id = o."comboId" AND o."deletedAt" IS NULL
        LEFT JOIN "Invitee" i ON o.id = i."orderId" AND i."deletedAt" IS NULL
        WHERE e."year" = ${year} AND c."deletedAt" IS NULL
        GROUP BY c.id, c."name", c."price", c."personsIncluded"
        ORDER BY order_count DESC, total_revenue DESC
        LIMIT ${limit}
      `;
    }

    const combosRanking = (combosRankingRaw as any[]).map(row => ({
      comboName: row.combo_name,
      price: Number(row.price || 0),
      personsIncluded: Number(row.personsIncluded || 0),
      orderCount: Number(row.order_count || 0),
      totalRevenue: Number(row.total_revenue || 0),
      totalInvitees: Number(row.total_invitees || 0),
      avgOrderValue: Number(row.order_count || 0) > 0
        ? Number(row.total_revenue || 0) / Number(row.order_count || 0)
        : 0
    }));

    return {
      ranking: combosRanking,
      summary: {
        totalCombos: combosRanking.length,
        totalRevenue: combosRanking.reduce((sum, combo) => sum + combo.totalRevenue, 0),
        totalOrders: combosRanking.reduce((sum, combo) => sum + combo.orderCount, 0),
        mostPopular: combosRanking[0] || null
      }
    };
  }

  async getEventsRanking(year: number, limit: number = 5) {
    // Obtener eventos con sus órdenes e invitados
    const events = await this.prisma.event.findMany({
      where: { year, deletedAt: null },
      include: {
        Order: {
          where: { deletedAt: null },
          include: {
            Invitee: {
              where: { deletedAt: null },
              select: { id: true, attendance: true }
            }
          }
        }
      },
      take: limit
    });

    const eventsRanking = events.map(event => {
      const orders = event.Order;
      const invitees = orders.flatMap(order => order.Invitee);
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Calcular asistencia por día desde JSON
      const attendanceByDay: { [dayNumber: string]: number } = {};
      invitees.forEach(invitee => {
        const attendance = invitee.attendance as any;
        if (attendance && attendance.days) {
          Object.entries(attendance.days).forEach(([dayNumber, record]: [string, any]) => {
            if (record.attended) {
              attendanceByDay[dayNumber] = (attendanceByDay[dayNumber] || 0) + 1;
            }
          });
        }
      });

      return {
        eventName: event.topic,
        capacity: event.capacity,
        salesStartDate: event.salesStartDate,
        orderCount: orders.length,
        totalRevenue,
        totalInvitees: invitees.length,
        attendanceByDay,
        utilizationRate: event.capacity > 0
          ? (invitees.length / event.capacity) * 100
          : 0
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      ranking: eventsRanking,
      summary: {
        totalEvents: eventsRanking.length,
        totalRevenue: eventsRanking.reduce((sum, event) => sum + event.totalRevenue, 0),
        totalOrders: eventsRanking.reduce((sum, event) => sum + event.orderCount, 0),
        avgUtilization: eventsRanking.length > 0 
          ? eventsRanking.reduce((sum, event) => sum + event.utilizationRate, 0) / eventsRanking.length
          : 0,
        topEvent: eventsRanking[0] || null
      }
    };
  }

  async getActivityHeatmap(year: number) {
    // Actividad por hora del día y día de la semana
    const activityHeatmapRaw = await this.prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        EXTRACT(DOW FROM "createdAt") as day_of_week,
        COUNT(*) as activity_count
      FROM (
        SELECT "createdAt" FROM "Order" WHERE "deletedAt" IS NULL AND "year" = ${year}
        UNION ALL
        SELECT "createdAt" FROM "Payment" WHERE "deletedAt" IS NULL AND "year" = ${year}
        UNION ALL
        SELECT "createdAt" FROM "Invitee" WHERE "deletedAt" IS NULL
      ) combined_activity
      GROUP BY hour, day_of_week
      ORDER BY day_of_week, hour
    `;

    const heatmapData = (activityHeatmapRaw as any[]).map(row => ({
      hour: Number(row.hour),
      dayOfWeek: Number(row.day_of_week),
      activityCount: Number(row.activity_count || 0),
      dayName: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][Number(row.day_of_week)]
    }));

    return {
      heatmap: heatmapData,
      summary: {
        totalActivity: heatmapData.reduce((sum, item) => sum + item.activityCount, 0),
        peakHour: heatmapData.reduce((peak, current) => 
          current.activityCount > peak.activityCount ? current : peak, 
          heatmapData[0] || { hour: 0, activityCount: 0 }
        ),
        peakDay: heatmapData.reduce((peak, current) => 
          current.activityCount > peak.activityCount ? current : peak, 
          heatmapData[0] || { dayOfWeek: 0, activityCount: 0 }
        )
      }
    };
  }

  async getPendingOrdersDebug(year: number) {
    const pendingOrders = await this.prisma.order.findMany({
      where: { 
        year: year,
        status: { in: ['PENDING', 'REVIEW'] },
        paymentType: { not: 'MERCADOPAGO' },
        deletedAt: null 
      },
      select: {
        id: true,
        status: true,
        year: true,
        deletedAt: true,
        createdAt: true,
        total: true,
        email: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      count: pendingOrders.length,
      orders: pendingOrders,
      year: year
    };
  }
}