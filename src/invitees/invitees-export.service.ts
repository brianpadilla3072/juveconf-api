/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  InviteesIntrospectionService,
  MetadataField,
  MerchType
} from './invitees-introspection.service';
import {
  ExportFilterDto,
  ExportColumn,
  ExportSchema,
  ExportData,
} from './DTOs/export-filter.dto';

@Injectable()
export class InviteesExportService {
  constructor(
    private prisma: PrismaService,
    private introspection: InviteesIntrospectionService,
  ) {}

  /**
   * Calcula la edad a partir de una fecha de nacimiento
   */
  private calculateAge(birthdate: string): number | null {
    try {
      const today = new Date();
      const birthDate = new Date(birthdate);

      if (isNaN(birthDate.getTime())) {
        return null;
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene los números de días que asistió un invitee
   */
  private getAttendedDays(attendance: any): string {
    try {
      if (!attendance || !attendance.days) {
        return '';
      }

      const attendedDays: number[] = [];

      // Recorrer todos los días en attendance.days
      for (const [dayNum, dayData] of Object.entries(attendance.days)) {
        if (dayData && typeof dayData === 'object' && (dayData as any).attended === true) {
          attendedDays.push(parseInt(dayNum));
        }
      }

      // Ordenar y convertir a string separado por comas
      return attendedDays.length > 0
        ? attendedDays.sort((a, b) => a - b).join(', ')
        : '';
    } catch {
      return '';
    }
  }

  /**
   * Construye el esquema de exportación dinámicamente basado en los filtros
   */
  async buildExportSchema(filter: ExportFilterDto): Promise<ExportSchema> {
    const {
      eventId,
      includeAttendance = true,
      includeMerchandising = true,
      includeMetadata = true,
      selectedMetadataFields = [],
      selectedMerchTypes = [],
    } = filter;

    // 1. Obtener evento para días
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { eventDays: true },
    });

    const eventDays = (event?.eventDays as any)?.days || [];

    // 2. Descubrir campos de metadata dinámicamente
    let metadataFields: MetadataField[] = [];
    if (includeMetadata) {
      metadataFields = await this.introspection.discoverMetadataFields(eventId);

      // Filtrar si se especificaron campos específicos
      if (selectedMetadataFields.length > 0) {
        metadataFields = metadataFields.filter((field) =>
          selectedMetadataFields.includes(field.key),
        );
      }
    }

    // 3. Descubrir tipos de merch dinámicamente
    let merchTypes: MerchType[] = [];
    if (includeMerchandising) {
      merchTypes = await this.introspection.discoverMerchandiseTypes(eventId);

      // Filtrar si se especificaron tipos específicos
      if (selectedMerchTypes.length > 0) {
        merchTypes = merchTypes.filter((merch) =>
          selectedMerchTypes.includes(merch.type),
        );
      }
    }

    // 4. Descubrir campos adicionales disponibles
    const ADDITIONAL_FIELDS: ExportColumn[] = [
      { key: 'combo', label: 'Combo', type: 'string', width: 25 },
      { key: 'age', label: 'Edad', type: 'number', width: 10 },
      { key: 'createdAt', label: 'Fecha de Registro', type: 'date', width: 15 },
      { key: 'paymentType', label: 'Tipo de Pago', type: 'string', width: 15 },
      { key: 'amount', label: 'Monto Pagado', type: 'number', width: 12 },
    ];

    // Filtrar campos adicionales según selección
    const additionalColumns =
      filter.selectedAdditionalFields && filter.selectedAdditionalFields.length > 0
        ? ADDITIONAL_FIELDS.filter((field) =>
            filter.selectedAdditionalFields?.includes(field.key),
          )
        : ADDITIONAL_FIELDS; // Por defecto, incluir todos

    // 5. Construir esquema de columnas DINÁMICO
    const columns: ExportColumn[] = [
      // Campos básicos (siempre presentes)
      { key: 'name', label: 'Nombre', type: 'string', width: 30 },
      { key: 'cuil', label: 'CUIL', type: 'string', width: 20 },
      { key: 'email', label: 'Email', type: 'string', width: 25 },
      { key: 'phone', label: 'Teléfono', type: 'string', width: 15 },

      // Campos adicionales (seleccionables)
      ...additionalColumns,

      // Metadata dinámico
      ...metadataFields.map((field) => ({
        key: `metadata.${field.key}`,
        label: field.label,
        type: field.type,
        width: 15,
      })),

      // Merch dinámico
      ...merchTypes.map((merch) => ({
        key: `merch.${merch.type}`,
        label: `Talle ${merch.label}`,
        type: 'string',
        width: 12,
      })),

      // Días asistidos (columna única con números)
      ...(includeAttendance
        ? [
            {
              key: 'attendedDays',
              label: 'Días Asistidos',
              type: 'string',
              width: 15,
            },
          ]
        : []),

      // Columna de observaciones
      {
        key: 'observations',
        label: 'Observaciones',
        type: 'string',
        width: 20,
      },
    ];

    return { columns };
  }

  /**
   * Genera los datos de exportación completos
   */
  async generateExportData(filter: ExportFilterDto): Promise<ExportData> {
    const schema = await this.buildExportSchema(filter);

    // Construir filtro de invitados
    const whereClause: any = {
      deletedAt: null,
      Payment: {
        Order: {
          eventId: filter.eventId,
        },
      },
    };

    if (filter.comboIds && filter.comboIds.length > 0) {
      whereClause.Payment.Order.comboId = { in: filter.comboIds };
    }

    // Obtener invitados con relaciones
    const invitees = await this.prisma.invitee.findMany({
      where: whereClause,
      include: {
        Payment: {
          select: {
            type: true,
            amount: true,
            Order: {
              select: {
                Combo: {
                  select: {
                    name: true,
                    metadata: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transformar datos dinámicamente
    const rows = invitees.map((inv) => {
      const metadata = inv.metadata ? JSON.parse(inv.metadata) : {};
      const attendance = inv.attendance as any;
      const row: Record<string, any> = {};

      schema.columns.forEach((col) => {
        if (col.key.startsWith('metadata.')) {
          const fieldKey = col.key.replace('metadata.', '');
          row[col.key] = metadata[fieldKey] ?? '';
        } else if (col.key.startsWith('merch.')) {
          const merchType = col.key.replace('merch.', '');
          row[col.key] = metadata.merchandiseSizes?.[merchType] ?? '';
        } else if (col.key === 'attendedDays') {
          // Calcular días asistidos usando helper
          row[col.key] = this.getAttendedDays(attendance);
        } else if (col.key === 'email') {
          // Priorizar email de metadata sobre email directo
          row[col.key] = metadata.email || inv.email || '';
        } else if (col.key === 'phone') {
          // Priorizar phone de metadata sobre phone directo
          row[col.key] = metadata.phone || inv.phone || '';
        } else if (col.key === 'combo') {
          // Nombre del combo
          row[col.key] = inv.Payment?.Order?.Combo?.name || '';
        } else if (col.key === 'age') {
          // Edad calculada desde birthdate
          row[col.key] = metadata.birthdate ? this.calculateAge(metadata.birthdate) : '';
        } else if (col.key === 'createdAt') {
          // Fecha de registro formateada
          row[col.key] = inv.createdAt ? inv.createdAt.toISOString().split('T')[0] : '';
        } else if (col.key === 'paymentType') {
          // Tipo de pago
          row[col.key] = inv.Payment?.type || '';
        } else if (col.key === 'amount') {
          // Monto pagado
          row[col.key] = inv.Payment?.amount || '';
        } else if (col.key === 'observations') {
          row[col.key] = ''; // Columna vacía para anotaciones manuales
        } else {
          row[col.key] = inv[col.key] ?? '';
        }
      });

      return row;
    });

    return { schema, rows };
  }
}
