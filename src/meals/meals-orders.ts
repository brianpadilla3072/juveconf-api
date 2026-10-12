/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { parseMealConfig } from './meals-config.schema';
import { MealPick, MealsQuote, QuotedPick, quoteMeals } from './meals-pricing';
import { validateRegistration } from './meals-registration.schema';

interface AttendeeLike {
  metadata?: string;
  meals?: MealPick[];
}

export const REGISTRATION_CODE_PREFIX = 'JC-';

/**
 * Hook de creacion de orden: devuelve la cotizacion de comidas solo si el COMBO elegido las tiene
 * activadas. Con el combo sin comidas devuelve null (flujo original) y rechaza si llegan comidas.
 * Los menus y precios salen de la configuracion del evento del combo.
 */
export async function prepareMealsForOrder(
  prisma: PrismaService,
  combo: { eventId: string; mealsEnabled: boolean },
  attendees: AttendeeLike[],
): Promise<MealsQuote | null> {
  const anyMeals = attendees.some((a) => a.meals?.length);

  if (!combo.mealsEnabled) {
    if (anyMeals) throw new BadRequestException('Este combo no incluye la opcion de comidas');
    return null;
  }

  const event = await prisma.event.findFirst({
    where: { id: combo.eventId, deletedAt: null },
    select: { mealConfig: true },
  });
  const config = parseMealConfig(event?.mealConfig);
  if (!config) throw new BadRequestException('Las comidas de este evento no estan configuradas');

  attendees.forEach((a, i) => validateRegistration(a.metadata, `Invitado ${i + 1}`));
  return quoteMeals(config, attendees.map((a) => a.meals));
}

/** Las rutas de pago sin soporte de comidas (efectivo, MercadoPago) no deben aceptarlas en silencio. */
export function assertNoMeals(attendees: AttendeeLike[] | undefined): void {
  if (attendees?.some((a) => a.meals?.length)) {
    throw new BadRequestException('Las comidas solo se pueden comprar por transferencia');
  }
}

/** Contador atomico por evento: JC-0001, JC-0002, ... */
export async function nextRegistrationCode(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<string> {
  const { registrationSeq } = await tx.event.update({
    where: { id: eventId },
    data: { registrationSeq: { increment: 1 } },
    select: { registrationSeq: true },
  });
  return `${REGISTRATION_CODE_PREFIX}${String(registrationSeq).padStart(4, '0')}`;
}

export async function createMealSelections(
  tx: Prisma.TransactionClient,
  params: { inviteeId: string; orderId: string; picks: QuotedPick[] },
): Promise<void> {
  if (!params.picks.length) return;
  await tx.mealSelection.createMany({
    data: params.picks.map((p) => ({
      inviteeId: params.inviteeId,
      orderId: params.orderId,
      slotCode: p.slotCode,
      optionNumber: p.optionNumber,
      optionName: p.optionName,
      price: p.price,
    })),
  });
}

/** "jc-247", "247" o "JC-0247" -> "JC-0247"; null si no parece un codigo. */
export function normalizeRegistrationCode(input: string): string | null {
  const match = /^\s*(?:jc-?)?(\d{1,6})\s*$/i.exec(input);
  return match ? `${REGISTRATION_CODE_PREFIX}${match[1].padStart(4, '0')}` : null;
}
