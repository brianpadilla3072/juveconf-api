/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface Attendee {
  name: string;
  cuil: string;
  metadata?: string; // JSON string with email, phone, birthdate, city, church, merchandiseSizes
}

export interface MetadataPayload {
  name: undefined;
  orderId: string;
  userId: string | null;
  eventId: string;
  comboId: string;
  quantity: number;
  email: string;
  phone?: string;
  cuil: string;
  totalAmount: number;
  currency: string;
  attendees: Attendee[];
  iat: number;
}

@Injectable()
export class JwtService {
  private readonly secret = process.env.MP_WEBHOOK_SECRET || '';

  signMetadata(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.secret, { algorithm: 'HS256' });
  }

 verifyMetadata(token: string): Record<string, unknown> | null {
  try {
    const decoded = jwt.verify(token, this.secret);
    return decoded as Record<string, unknown>;  // Devuelve el payload decodificado
  } catch (err) {
    return null;  // Si ocurre un error, devuelve null
  }
}
   // Decodificar token sin verificar (solo obtener los datos)
  decodeMetadata(token: string): MetadataPayload | null {
    const decoded = jwt.decode(token);
    return decoded as MetadataPayload | null;
  }
}
