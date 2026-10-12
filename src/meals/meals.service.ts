/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { MealConfigSchema, parseMealConfig } from './meals-config.schema';
import { normalizeRegistrationCode } from './meals-orders';
import { DeliverMealDto, LookupMealDto, ScanMealDto, UpdateMealConfigDto } from './dto/meals.dto';

export type MealStatus = 'PENDING' | 'DELIVERED' | 'NOT_PURCHASED' | 'UNPAID';

export interface BuffetView {
  inviteeId: string;
  code: string | null;
  name: string;
  menu: string | null;
  status: MealStatus;
  deliveredAt: Date | null;
}

const BUFFET_SELECT = {
  id: true,
  name: true,
  registrationCode: true,
  Order: { select: { status: true } },
  MealSelection: { select: { slotCode: true, optionName: true, deliveredAt: true } },
} satisfies Prisma.InviteeSelect;

type BuffetInvitee = Prisma.InviteeGetPayload<{ select: typeof BUFFET_SELECT }>;

export interface RegistrationRow {
  key: string;
  orderId: string;
  paymentState: 'PENDING' | 'CONFIRMED';
  orderStatus: OrderStatus;
  proofSent: boolean;
  orderTotal: number;
  inviteeId: string | null;
  code: string | null;
  name: string;
  cuil: string;
  email: string | null;
  phone: string | null;
  accredited: boolean;
  city: string | null;
  church: string | null;
  group: string | null;
  lodging: { needed: boolean; nights: string[] };
  emergency: { name: string; phone: string } | null;
  dietary: string | null;
  guardian: { name: string; dni: string; phone: string } | null;
  meals: { slotCode: string; optionName: string; delivered: boolean }[];
  createdAt: Date;
}

function safeJson(text: string | null | undefined): Record<string, any> {
  if (!text) return {};
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function hasAttended(attendance: unknown): boolean {
  const days = (attendance as any)?.days;
  return !!days && Object.values(days).some((d: any) => d?.attended === true);
}

@Injectable()
export class MealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ---------- publico ----------

  /**
   * Menus y descuentos del evento. `enabled` indica que hay configuracion cargada;
   * si un combo permite comidas lo indica su propio `mealsEnabled`.
   */
  async getPublicConfig(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { mealConfig: true },
    });
    const config = parseMealConfig(event?.mealConfig);
    if (!config) return { enabled: false };
    return {
      enabled: true,
      slots: [...config.slots].sort((a, b) => a.order - b.order),
      discountTiers: config.discountTiers,
    };
  }

  async markProofSent(orderId: string) {
    const result = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        deletedAt: null,
        status: { in: [OrderStatus.REVIEW, OrderStatus.PENDING] },
        Combo: { mealsEnabled: true },
      },
      data: { proofSent: true },
    });
    if (result.count === 0) throw new NotFoundException('Orden no encontrada o ya procesada');
    return { success: true };
  }

  // ---------- configuracion ----------

  async setConfig(eventId: string, dto: UpdateMealConfigDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { id: true },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const parsed = MealConfigSchema.safeParse(dto.mealConfig);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Configuracion de comidas invalida',
        errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { mealConfig: parsed.data as Prisma.InputJsonValue },
      select: { id: true, mealConfig: true },
    });
  }

  // ---------- buffet ----------

  private toBuffetView(invitee: BuffetInvitee, slotCode: string): BuffetView {
    const selection = invitee.MealSelection.find((s) => s.slotCode === slotCode);
    let status: MealStatus;
    if (invitee.Order?.status !== OrderStatus.PAID) status = 'UNPAID';
    else if (!selection) status = 'NOT_PURCHASED';
    else status = selection.deliveredAt ? 'DELIVERED' : 'PENDING';
    return {
      inviteeId: invitee.id,
      code: invitee.registrationCode,
      name: invitee.name,
      menu: selection?.optionName ?? null,
      status,
      deliveredAt: selection?.deliveredAt ?? null,
    };
  }

  async scan(dto: ScanMealDto): Promise<BuffetView> {
    const where: Prisma.InviteeWhereInput = { deletedAt: null };
    if (dto.inviteeId) {
      where.id = dto.inviteeId;
      if (dto.paymentId) where.paymentId = dto.paymentId;
    } else if (dto.code) {
      const code = normalizeRegistrationCode(dto.code);
      if (!code) throw new BadRequestException('Codigo de inscripcion invalido');
      where.registrationCode = code;
    } else {
      throw new BadRequestException('Falta el identificador de la entrada');
    }

    const invitee = await this.prisma.invitee.findFirst({ where, select: BUFFET_SELECT });
    if (!invitee) throw new NotFoundException('Entrada no valida');
    return this.toBuffetView(invitee, dto.slotCode);
  }

  async lookup(dto: LookupMealDto): Promise<BuffetView[]> {
    const code = normalizeRegistrationCode(dto.q);
    const invitees = await this.prisma.invitee.findMany({
      where: {
        deletedAt: null,
        Order: { Combo: { mealsEnabled: true } },
        OR: [
          ...(code ? [{ registrationCode: code }] : []),
          { name: { contains: dto.q.trim(), mode: 'insensitive' as const } },
        ],
      },
      select: BUFFET_SELECT,
      orderBy: { name: 'asc' },
      take: 10,
    });
    return invitees.map((i) => this.toBuffetView(i, dto.slotCode));
  }

  async deliver(dto: DeliverMealDto, deliveredById: string | undefined) {
    // Una sola sentencia: solo una llamada puede pasar de "no entregada" a "entregada".
    const result = await this.prisma.mealSelection.updateMany({
      where: {
        inviteeId: dto.inviteeId,
        slotCode: dto.slotCode,
        deliveredAt: null,
        Invitee: { deletedAt: null, Order: { status: OrderStatus.PAID } },
      },
      data: { deliveredAt: new Date(), deliveredById: deliveredById ?? null },
    });
    if (result.count === 1) return { delivered: true, status: 'DELIVERED' as MealStatus };

    const selection = await this.prisma.mealSelection.findUnique({
      where: { inviteeId_slotCode: { inviteeId: dto.inviteeId, slotCode: dto.slotCode } },
      select: { deliveredAt: true, Invitee: { select: { Order: { select: { status: true } } } } },
    });
    if (!selection) return { delivered: false, status: 'NOT_PURCHASED' as MealStatus };
    if (selection.Invitee.Order?.status !== OrderStatus.PAID) {
      return { delivered: false, status: 'UNPAID' as MealStatus };
    }
    return { delivered: false, status: 'DELIVERED' as MealStatus, deliveredAt: selection.deliveredAt };
  }

  // ---------- administracion ----------

  private async loadRows(eventId: string): Promise<RegistrationRow[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        eventId,
        deletedAt: null,
        status: { in: [OrderStatus.PENDING, OrderStatus.REVIEW, OrderStatus.PAID] },
      },
      select: {
        id: true,
        status: true,
        proofSent: true,
        total: true,
        createdAt: true,
        metadataToken: true,
        orderSnapshot: true,
        Invitee: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            cuil: true,
            email: true,
            phone: true,
            registrationCode: true,
            attendance: true,
            metadata: true,
            MealSelection: { select: { slotCode: true, optionName: true, deliveredAt: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows: RegistrationRow[] = [];
    for (const order of orders) {
      const base = {
        orderId: order.id,
        orderStatus: order.status,
        proofSent: order.proofSent,
        orderTotal: order.total,
        createdAt: order.createdAt,
      };
      const detailsFrom = (meta: Record<string, any>) => ({
        city: meta.city ?? null,
        church: meta.church ?? null,
        group: meta.group ?? null,
        lodging: {
          needed: !!meta.lodging?.needed,
          nights: Array.isArray(meta.lodging?.nights) ? (meta.lodging.nights as string[]) : [],
        },
        emergency: meta.emergency ?? null,
        dietary: meta.dietary ?? null,
        guardian: meta.guardian ?? null,
      });

      if (order.Invitee.length > 0) {
        for (const invitee of order.Invitee) {
          const meta = safeJson(invitee.metadata);
          rows.push({
            ...base,
            key: invitee.id,
            paymentState: order.status === OrderStatus.PAID ? 'CONFIRMED' : 'PENDING',
            inviteeId: invitee.id,
            code: invitee.registrationCode,
            name: invitee.name,
            cuil: invitee.cuil,
            email: invitee.email,
            phone: invitee.phone ?? meta.phone ?? null,
            accredited: hasAttended(invitee.attendance),
            ...detailsFrom(meta),
            meals: invitee.MealSelection.map((s) => ({
              slotCode: s.slotCode,
              optionName: s.optionName,
              delivered: !!s.deliveredAt,
            })),
          });
        }
        continue;
      }

      // Orden sin aprobar: los invitados todavia viven en el token de metadata y el snapshot.
      const payload = order.metadataToken ? this.jwtService.decodeMetadata(order.metadataToken) : null;
      const snapshotMeals = ((order.orderSnapshot as any)?.meals?.perAttendee ?? []) as {
        picks: { slotCode: string; optionName: string }[];
      }[];
      (payload?.attendees ?? []).forEach((attendee, index) => {
        const meta = safeJson(attendee.metadata);
        rows.push({
          ...base,
          key: `${order.id}:${index}`,
          paymentState: 'PENDING',
          inviteeId: null,
          code: null,
          name: attendee.name,
          cuil: attendee.cuil,
          email: meta.email ?? null,
          phone: meta.phone ?? null,
          accredited: false,
          ...detailsFrom(meta),
          meals: (snapshotMeals[index]?.picks ?? []).map((p) => ({
            slotCode: p.slotCode,
            optionName: p.optionName,
            delivered: false,
          })),
        });
      });
    }
    return rows;
  }

  async registrations(eventId: string, q?: string) {
    const rows = await this.loadRows(eventId);
    const needle = q?.trim().toLowerCase();
    if (!needle) return rows;
    const code = normalizeRegistrationCode(needle);
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.cuil.includes(needle) ||
        (r.email ?? '').toLowerCase().includes(needle) ||
        (code !== null && r.code === code),
    );
  }

  async stats(eventId: string) {
    const [event, rows] = await Promise.all([
      this.prisma.event.findFirst({ where: { id: eventId, deletedAt: null }, select: { mealConfig: true } }),
      this.loadRows(eventId),
    ]);
    const config = parseMealConfig(event?.mealConfig);

    const confirmed = rows.filter((r) => r.paymentState === 'CONFIRMED');
    const slotMap = new Map<string, { name: string; order: number; sold: number; delivered: number; options: Map<string, { sold: number; delivered: number }> }>();
    for (const slot of config?.slots ?? []) {
      slotMap.set(slot.code, { name: slot.name, order: slot.order, sold: 0, delivered: 0, options: new Map() });
    }
    for (const row of confirmed) {
      for (const meal of row.meals) {
        const slot = slotMap.get(meal.slotCode) ?? { name: meal.slotCode, order: 99, sold: 0, delivered: 0, options: new Map() };
        slotMap.set(meal.slotCode, slot);
        const option = slot.options.get(meal.optionName) ?? { sold: 0, delivered: 0 };
        option.sold++;
        slot.sold++;
        if (meal.delivered) {
          option.delivered++;
          slot.delivered++;
        }
        slot.options.set(meal.optionName, option);
      }
    }

    const lodgingByNight: Record<string, number> = {};
    for (const row of confirmed) {
      if (row.lodging.needed) {
        for (const night of row.lodging.nights) lodgingByNight[night] = (lodgingByNight[night] ?? 0) + 1;
      }
    }

    return {
      registrations: {
        total: rows.length,
        pendingPayment: rows.filter((r) => r.paymentState === 'PENDING').length,
        proofSentPending: rows.filter((r) => r.paymentState === 'PENDING' && r.proofSent).length,
        confirmed: confirmed.length,
        accredited: confirmed.filter((r) => r.accredited).length,
      },
      meals: [...slotMap.entries()]
        .sort((a, b) => a[1].order - b[1].order)
        .map(([slotCode, s]) => ({
          slotCode,
          name: s.name,
          sold: s.sold,
          delivered: s.delivered,
          pending: s.sold - s.delivered,
          options: [...s.options.entries()].map(([optionName, o]) => ({
            optionName,
            sold: o.sold,
            delivered: o.delivered,
            pending: o.sold - o.delivered,
          })),
        })),
      lodgingByNight,
    };
  }
}
