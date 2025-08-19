import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngresoDto, UpdateIngresoDto, CreateEgresoDto, UpdateEgresoDto } from './DTOs';

@Injectable()
export class FinanzasService {
  private readonly logger = new Logger(FinanzasService.name);

  constructor(private prisma: PrismaService) {}

  // Servicios de Ingresos
  async createIngreso(createIngresoDto: CreateIngresoDto) {
    return this.prisma.ingreso.create({
      data: {
        ...createIngresoDto,
        fecha: new Date(createIngresoDto.fecha),
      },
    });
  }

  async findAllIngresos(year?: number) {
    const currentYear = year || new Date().getFullYear();
    return this.prisma.ingreso.findMany({
      where: {
        deletedAt: null,
        year: currentYear,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOneIngreso(id: string) {
    const ingreso = await this.prisma.ingreso.findUnique({
      where: { id },
    });
    if (!ingreso || ingreso.deletedAt) {
      throw new NotFoundException(`Ingreso with id ${id} not found`);
    }
    return ingreso;
  }

  async updateIngreso(id: string, updateIngresoDto: UpdateIngresoDto) {
    const existingIngreso = await this.findOneIngreso(id);
    const updateData: any = { ...updateIngresoDto };
    if (updateIngresoDto.fecha) {
      updateData.fecha = new Date(updateIngresoDto.fecha);
    }
    
    return this.prisma.ingreso.update({
      where: { id: existingIngreso.id },
      data: updateData,
    });
  }

  async removeIngreso(id: string) {
    const existingIngreso = await this.findOneIngreso(id);
    return this.prisma.ingreso.update({
      where: { id: existingIngreso.id },
      data: { deletedAt: new Date() },
    });
  }

  // Servicios de Egresos
  async createEgreso(createEgresoDto: CreateEgresoDto) {
    return this.prisma.egreso.create({
      data: {
        ...createEgresoDto,
        fecha: new Date(createEgresoDto.fecha),
      },
    });
  }

  async findAllEgresos(year?: number) {
    const currentYear = year || new Date().getFullYear();
    return this.prisma.egreso.findMany({
      where: {
        deletedAt: null,
        year: currentYear,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOneEgreso(id: string) {
    const egreso = await this.prisma.egreso.findUnique({
      where: { id },
    });
    if (!egreso || egreso.deletedAt) {
      throw new NotFoundException(`Egreso with id ${id} not found`);
    }
    return egreso;
  }

  async updateEgreso(id: string, updateEgresoDto: UpdateEgresoDto) {
    const existingEgreso = await this.findOneEgreso(id);
    const updateData: any = { ...updateEgresoDto };
    if (updateEgresoDto.fecha) {
      updateData.fecha = new Date(updateEgresoDto.fecha);
    }
    
    return this.prisma.egreso.update({
      where: { id: existingEgreso.id },
      data: updateData,
    });
  }

  async removeEgreso(id: string) {
    const existingEgreso = await this.findOneEgreso(id);
    return this.prisma.egreso.update({
      where: { id: existingEgreso.id },
      data: { deletedAt: new Date() },
    });
  }

  // Balance y estadísticas
  async getBalance(year?: number) {
    try {
      const currentYear = year || new Date().getFullYear();

      const ingresos = await this.prisma.ingreso.aggregate({
        where: {
          deletedAt: null,
          year: currentYear,
        },
        _sum: {
          monto: true,
        },
        _count: {
          id: true,
        },
      });

      const egresos = await this.prisma.egreso.aggregate({
        where: {
          deletedAt: null,
          year: currentYear,
        },
        _sum: {
          monto: true,
        },
        _count: {
          id: true,
        },
      });

      const totalIngresos = ingresos._sum.monto || 0;
      const totalEgresos = egresos._sum.monto || 0;
      const balance = totalIngresos - totalEgresos;

      return {
        year: currentYear,
        totalIngresos,
        totalEgresos,
        balance,
        countIngresos: ingresos._count.id,
        countEgresos: egresos._count.id,
        porcentajeGanancia: totalIngresos > 0 ? ((balance / totalIngresos) * 100) : 0,
      };
    } catch (error) {
      this.logger.error(`Error calculating balance: ${error.message}`);
      throw new InternalServerErrorException('Error al calcular balance');
    }
  }

  async getDashboardStats(year?: number) {
    try {
      const currentYear = year || new Date().getFullYear();

      // Ingresos por concepto
      const ingresosPorConcepto = await this.prisma.ingreso.groupBy({
        by: ['concepto'],
        where: {
          deletedAt: null,
          year: currentYear,
        },
        _sum: {
          monto: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            monto: 'desc',
          },
        },
      });

      // Egresos por concepto
      const egresosPorConcepto = await this.prisma.egreso.groupBy({
        by: ['concepto'],
        where: {
          deletedAt: null,
          year: currentYear,
        },
        _sum: {
          monto: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            monto: 'desc',
          },
        },
      });

      // Ingresos por método de pago
      const ingresosPorMetodo = await this.prisma.ingreso.groupBy({
        by: ['metodoPago'],
        where: {
          deletedAt: null,
          year: currentYear,
        },
        _sum: {
          monto: true,
        },
      });

      // Egresos por método de pago
      const egresosPorMetodo = await this.prisma.egreso.groupBy({
        by: ['metodoPago'],
        where: {
          deletedAt: null,
          year: currentYear,
        },
        _sum: {
          monto: true,
        },
      });

      // Evolución mensual
      const evolucionMensualRaw = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', fecha) as mes,
          SUM(CASE WHEN 'ingresos' = 'ingresos' THEN monto ELSE 0 END) as total_ingresos,
          SUM(CASE WHEN 'egresos' = 'egresos' THEN monto ELSE 0 END) as total_egresos
        FROM (
          SELECT fecha, monto, 'ingresos' as tipo FROM "Ingreso" WHERE "deletedAt" IS NULL AND year = ${currentYear}
          UNION ALL
          SELECT fecha, -monto, 'egresos' as tipo FROM "Egreso" WHERE "deletedAt" IS NULL AND year = ${currentYear}
        ) combined
        GROUP BY DATE_TRUNC('month', fecha)
        ORDER BY mes ASC
      `;

      const evolucionMensual = (evolucionMensualRaw as any[]).map(row => ({
        mes: row.mes,
        totalIngresos: Number(row.total_ingresos) || 0,
        totalEgresos: Math.abs(Number(row.total_egresos)) || 0,
      }));

      return {
        ingresosPorConcepto: ingresosPorConcepto.map(item => ({
          concepto: item.concepto,
          total: item._sum.monto || 0,
          cantidad: item._count.id,
        })),
        egresosPorConcepto: egresosPorConcepto.map(item => ({
          concepto: item.concepto,
          total: item._sum.monto || 0,
          cantidad: item._count.id,
        })),
        ingresosPorMetodo: ingresosPorMetodo.map(item => ({
          metodo: item.metodoPago,
          total: item._sum.monto || 0,
        })),
        egresosPorMetodo: egresosPorMetodo.map(item => ({
          metodo: item.metodoPago,
          total: item._sum.monto || 0,
        })),
        evolucionMensual,
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard stats: ${error.message}`);
      throw new InternalServerErrorException('Error al obtener estadísticas del dashboard');
    }
  }
}