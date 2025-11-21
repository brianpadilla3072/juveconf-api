/* eslint-disable prettier/prettier */
import { z } from 'zod';

/**
 * Esquema de validación para la metadata de asistencia
 * Contiene información calculada automáticamente sobre el día del evento
 */
export const AttendanceMetadataSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format'),
  dayLabel: z.string().optional()
});

/**
 * Esquema de validación para un registro individual de asistencia
 * Representa la asistencia de un invitado a un día específico del evento
 */
export const AttendanceRecordSchema = z.object({
  attended: z.boolean(),
  timestamp: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: AttendanceMetadataSchema.optional() // Opcional para retrocompatibilidad con datos existentes
});

/**
 * Esquema de validación para el objeto completo de asistencia
 * Estructura: { days: { "1": { attended: true, timestamp: "..." }, "2": {...} } }
 * Las claves en 'days' son números de día como strings ("1", "2", "3", etc.)
 */
export const AttendanceSchema = z.object({
  days: z.record(
    z.string().regex(/^\d+$/, 'Day key must be a numeric string'),
    AttendanceRecordSchema
  )
});

export type AttendanceMetadata = z.infer<typeof AttendanceMetadataSchema>;
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;
export type Attendance = z.infer<typeof AttendanceSchema>;
