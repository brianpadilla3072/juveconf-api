/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';
import { MealConfig, MealSlotConfig } from './meals-config.schema';

export interface MealPick {
  slotCode: string;
  optionNumber: number;
}

export interface QuotedPick {
  slotCode: string;
  optionNumber: number;
  optionName: string;
  price: number;
}

export interface AttendeeMealsQuote {
  picks: QuotedPick[];
  subtotal: number;
  discountPercent: number;
  discount: number;
  total: number;
}

export interface MealsQuote {
  perAttendee: AttendeeMealsQuote[];
  mealsTotal: number;
}

/** Porcentaje del escalon mas alto cuya cantidad sea <= count (1 comida sin escalon = 0%). */
export function discountPercentFor(count: number, tiers: Record<string, number>): number {
  let bestKey = 0;
  let percent = 0;
  for (const [key, pct] of Object.entries(tiers)) {
    const n = Number(key);
    if (n <= count && n >= bestKey) {
      bestKey = n;
      percent = pct;
    }
  }
  return percent;
}

export function menuLabel(slot: MealSlotConfig, optionNumber: number, optionName: string): string {
  return slot.options.length > 1 ? `Menú #${optionNumber} - ${optionName}` : optionName;
}

export function quoteMeals(
  config: MealConfig,
  attendeesMeals: Array<MealPick[] | undefined>,
): MealsQuote {
  const perAttendee = attendeesMeals.map((picks, index): AttendeeMealsQuote => {
    const seen = new Set<string>();
    const quoted: QuotedPick[] = (picks ?? []).map((pick) => {
      const slot = config.slots.find((s) => s.code === pick.slotCode);
      if (!slot) {
        throw new BadRequestException(`Invitado ${index + 1}: turno de comida invalido (${pick.slotCode})`);
      }
      const option = slot.options.find((o) => o.n === pick.optionNumber);
      if (!option) {
        throw new BadRequestException(`Invitado ${index + 1}: opcion invalida para ${slot.name}`);
      }
      if (seen.has(slot.code)) {
        throw new BadRequestException(`Invitado ${index + 1}: solo se puede elegir una opcion por turno (${slot.name})`);
      }
      seen.add(slot.code);
      return {
        slotCode: slot.code,
        optionNumber: option.n,
        optionName: menuLabel(slot, option.n, option.name),
        price: option.price,
      };
    });

    const subtotal = quoted.reduce((sum, p) => sum + p.price, 0);
    const discountPercent = discountPercentFor(quoted.length, config.discountTiers);
    const total = Math.round((subtotal * (100 - discountPercent)) / 100);
    return { picks: quoted, subtotal, discountPercent, discount: subtotal - total, total };
  });

  return { perAttendee, mealsTotal: perAttendee.reduce((sum, a) => sum + a.total, 0) };
}
