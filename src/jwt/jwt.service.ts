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

  verifyMetadata(token: string): boolean {
  try {
    jwt.verify(token, this.secret);
    return true;  // Si el token es válido, devuelve true
  } catch (err) {
    return false;  // Si ocurre un error, el token es inválido, por lo tanto devuelve false
  }
}
   // Decodificar token sin verificar (solo obtener los datos)
  decodeMetadata(token: string): Record<string, unknown> {
    return jwt.decode(token) as Record<string, unknown>;
  }
}
