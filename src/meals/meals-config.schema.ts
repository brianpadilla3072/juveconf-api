/* eslint-disable prettier/prettier */
import { z } from 'zod';

export const MealOptionSchema = z.object({
  n: z.number().int().min(1).max(9),
  name: z.string().trim().min(1).max(120),
  price: z.number().min(0).max(10_000_000),
});

export const MealSlotSchema = z
  .object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]{1,19}$/, 'Codigo de turno invalido'),
    name: z.string().trim().min(1).max(60),
    order: z.number().int().min(0).max(99),
    options: z.array(MealOptionSchema).min(1).max(9),
  })
  .refine((s) => new Set(s.options.map((o) => o.n)).size === s.options.length, {
    message: 'Hay opciones repetidas en un turno',
  });

export const MealConfigSchema = z
  .object({
    slots: z.array(MealSlotSchema).min(1).max(12),
    // porcentaje de descuento segun la cantidad de comidas de una persona: {"2": 5, "3": 10, "4": 15}
    discountTiers: z.record(z.string().regex(/^[1-9]\d?$/), z.number().min(0).max(100)),
  })
  .refine((c) => new Set(c.slots.map((s) => s.code)).size === c.slots.length, {
    message: 'Hay turnos repetidos',
  });

export type MealConfig = z.infer<typeof MealConfigSchema>;
export type MealSlotConfig = z.infer<typeof MealSlotSchema>;

export function parseMealConfig(raw: unknown): MealConfig | null {
  const result = MealConfigSchema.safeParse(raw);
  return result.success ? result.data : null;
}
