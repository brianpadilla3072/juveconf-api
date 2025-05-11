/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/restrict-template-expressions */ 
/* eslint-disable prettier/prettier */
// src/mercadopago/mp-signature.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MpSignatureService {
  private readonly logger = new Logger(MpSignatureService.name);
  private readonly secret = process.env.MP_WEBHOOK_SECRET!;

  verify(signatureHeader: string, rawBody: Buffer): boolean {
    this.logger.log('Iniciando verificación de firma...');
    this.logger.debug(`Signature Header: ${signatureHeader}`);
    this.logger.debug(`Raw Body Buffer (hex): ${rawBody.toString('hex')}`);
    this.logger.debug(`Secret configurado: ${this.secret ? '✅ presente' : '❌ ausente'}`);

    if (!this.secret || !signatureHeader || !rawBody) {
      this.logger.error(`Parámetros inválidos. signatureHeader: ${signatureHeader}, rawBody: ${rawBody}`);
      return false;
    }

    const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
      const [key, val] = part.split('=');
      acc[key.trim()] = val.trim();
      return acc;
    }, {});

    const receivedHash = parts['v1'];
    this.logger.debug(`Hash recibido: ${receivedHash}`);

    const computedHash = crypto
      .createHmac('sha256', this.secret)
      .update(rawBody)
      .digest('hex');

    this.logger.debug(`Hash calculado: ${computedHash}`);

    const isValid = computedHash === receivedHash;
    this.logger.log(`Firma válida: ${isValid}`);

    if (!isValid) {
      this.logger.warn(`Firma inválida. Esperada: ${computedHash}, recibida: ${receivedHash}`);
    }

    return isValid;
  }
}
