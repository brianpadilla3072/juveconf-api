/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

export interface MetadataField {
  key: string;
  label: string;
  type: string;
  sampleValues?: any[];
}

export interface MerchType {
  type: string;
  label: string;
  sizes: string[];
}

@Injectable()
export class InviteesIntrospectionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Escanea todos los invitados de un evento y extrae TODOS los campos de metadata
   * que existen en la realidad (no hardcoded)
   */
  async discoverMetadataFields(eventId?: string): Promise<MetadataField[]> {
    const whereClause: any = {
      deletedAt: null,
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
      select: { metadata: true },
      take: 1000, // Limit for performance
    });

    const fieldSet = new Map<string, Set<any>>();

    invitees.forEach((inv) => {
      if (!inv.metadata) return;

      try {
        const parsed = JSON.parse(inv.metadata);

        Object.entries(parsed).forEach(([key, value]) => {
          // Skip merchandiseSizes - tiene manejo especial
          if (key === 'merchandiseSizes') return;

          if (!fieldSet.has(key)) {
            fieldSet.set(key, new Set());
          }

          if (value !== null && value !== undefined && value !== '') {
            fieldSet.get(key)?.add(value);
          }
        });
      } catch (error) {
        // Ignorar metadata inválida
        console.warn('Invalid metadata JSON:', inv.metadata);
      }
    });

    return Array.from(fieldSet.entries())
      .map(([key, values]) => ({
        key,
        label: this.generateLabel(key),
        type: this.inferType(values),
        sampleValues: Array.from(values).slice(0, 3),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Escanea todos los combos de un evento y extrae TODOS los tipos de merch
   */
  async discoverMerchandiseTypes(eventId: string): Promise<MerchType[]> {
    const combos = await this.prisma.combo.findMany({
      where: { eventId, deletedAt: null },
      select: { id: true, name: true, metadata: true },
    });

    const merchMap = new Map<string, { label: string; sizes: Set<string> }>();

    combos.forEach((combo) => {
      try {
        const metadata = combo.metadata as any;
        const merchList = metadata?.merchandise?.allMerchandise || [];

        merchList.forEach((item: any) => {
          if (!merchMap.has(item.type)) {
            merchMap.set(item.type, {
              label: item.label || this.generateLabel(item.type),
              sizes: new Set<string>(),
            });
          }

          // Agregar talles disponibles
          if (Array.isArray(item.sizes)) {
            item.sizes.forEach((size: string) =>
              merchMap.get(item.type)?.sizes.add(size),
            );
          }
        });
      } catch (error) {
        console.warn('Invalid combo metadata:', combo.id);
      }
    });

    return Array.from(merchMap.entries())
      .map(([type, info]) => ({
        type,
        label: info.label,
        sizes: Array.from(info.sizes).sort(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Genera un label legible a partir de una key camelCase
   */
  private generateLabel(key: string): string {
    return (
      key
        // Inserta espacio antes de mayúsculas
        .replace(/([A-Z])/g, ' $1')
        // Capitaliza primera letra
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
    );
  }

  /**
   * Infiere el tipo de dato basándose en los valores de ejemplo
   */
  private inferType(values: Set<any>): string {
    const sample = Array.from(values)[0];

    if (!sample) return 'string';

    if (typeof sample === 'number') return 'number';
    if (typeof sample === 'boolean') return 'boolean';

    // Detectar fechas (YYYY-MM-DD o ISO 8601)
    if (
      typeof sample === 'string' &&
      /^\d{4}-\d{2}-\d{2}/.test(sample)
    ) {
      return 'date';
    }

    return 'string';
  }
}
