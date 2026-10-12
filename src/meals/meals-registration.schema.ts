/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const PersonContact = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(30),
});

/** Datos de registro por invitado (van dentro del metadata JSON) cuando el evento tiene comidas. */
export const RegistrationSchema = z
  .object({
    phone: z.string().trim().min(6).max(30),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de nacimiento invalida'),
    city: z.string().trim().min(1).max(80),
    church: z.string().trim().min(1).max(120),
    group: z.string().trim().max(120).optional(),
    lodging: z
      .object({ needed: z.boolean(), nights: z.array(z.string().max(20)).max(7) })
      .optional(),
    emergency: PersonContact,
    dietary: z.string().trim().max(300).optional(),
    guardian: PersonContact.extend({ dni: z.string().trim().min(6).max(15) }).optional(),
  })
  .passthrough();

export function isMinor(birthdate: string, now = new Date()): boolean {
  const born = new Date(`${birthdate}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return false;
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const m = now.getUTCMonth() - born.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < born.getUTCDate())) age--;
  return age < 18;
}

export function validateRegistration(metadata: string | undefined, label: string): void {
  let parsed: unknown;
  try {
    parsed = metadata ? JSON.parse(metadata) : undefined;
  } catch {
    throw new BadRequestException(`${label}: los datos de registro no son validos`);
  }
  const result = RegistrationSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new BadRequestException(`${label}: dato de registro invalido (${first.path.join('.') || 'metadata'})`);
  }
  if (isMinor(result.data.birthdate) && !result.data.guardian) {
    throw new BadRequestException(`${label}: falta el adulto responsable (menor de edad)`);
  }
}
