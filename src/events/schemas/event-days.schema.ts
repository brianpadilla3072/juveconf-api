/* eslint-disable prettier/prettier */
import { z } from 'zod';

/**
 * Esquema de validación para un día individual del evento
 */
export const EventDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dayNumber: z.number().int().positive(),
  label: z.string().optional(),
  type: z.string().optional() // "plenaria", "talleres", "general", etc.
});

/**
 * Esquema de validación para el objeto completo de días del evento
 * Estructura: { days: [...], totalDays: N }
 */
export const EventDaysSchema = z.object({
  days: z.array(EventDaySchema).min(1, 'Event must have at least one day'),
  totalDays: z.number().int().positive()
}).refine(
  (data) => data.totalDays === data.days.length,
  {
    message: 'totalDays must match the length of days array'
  }
);

export type EventDay = z.infer<typeof EventDaySchema>;
export type EventDays = z.infer<typeof EventDaysSchema>;
