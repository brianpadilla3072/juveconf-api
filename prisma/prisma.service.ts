/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /** Se ejecuta cuando NestJS inicializa este módulo */
  async onModuleInit() {
    await this.$connect();
  }

  /** Se ejecuta cuando NestJS destruye este módulo (shutdown) */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Prisma disconnected');
  }
}
