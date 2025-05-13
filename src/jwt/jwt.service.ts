/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

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
  decodeMetadata(token: string): Record<string, unknown> {
    return jwt.decode(token) as Record<string, unknown>;
  }
}
