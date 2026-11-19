/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EmailStatus, EmailType } from '@prisma/client';

export interface EnqueueEmailDto {
  to: string;
  subject: string;
  html: string;
  emailType: EmailType;
  orderId?: string;
  paymentId?: string;
}

export interface EnqueueTemplateEmailDto {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  emailType: EmailType;
  orderId?: string;
  paymentId?: string;
}

@Injectable()
export class EmailQueueService {
  constructor(private prisma: PrismaService) {}

  async enqueueEmail(dto: EnqueueEmailDto) {
    return this.prisma.emailQueue.create({
      data: {
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
        emailType: dto.emailType,
        orderId: dto.orderId,
        paymentId: dto.paymentId,
        status: EmailStatus.PENDING,
        attempts: 0,
      },
    });
  }

  async enqueueTemplateEmail(dto: EnqueueTemplateEmailDto) {
    return this.prisma.emailQueue.create({
      data: {
        to: dto.to,
        subject: dto.subject,
        template: dto.template,
        context: dto.context,
        emailType: dto.emailType,
        orderId: dto.orderId,
        paymentId: dto.paymentId,
        status: EmailStatus.PENDING,
        attempts: 0,
      },
    });
  }

  async getPendingEmails(limit: number = 50) {
    return this.prisma.emailQueue.findMany({
      where: {
        status: EmailStatus.PENDING,
        attempts: {
          lt: 3,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  async markAsSent(id: string) {
    return this.prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  async markAsFailed(id: string, errorMessage: string) {
    const email = await this.prisma.emailQueue.findUnique({
      where: { id },
    });

    const newAttempts = (email?.attempts || 0) + 1;
    const status = newAttempts >= 3 ? EmailStatus.FAILED : EmailStatus.PENDING;

    return this.prisma.emailQueue.update({
      where: { id },
      data: {
        attempts: newAttempts,
        lastAttemptAt: new Date(),
        errorMessage,
        status,
      },
    });
  }

  /**
   * Difiere un correo SIN consumir un intento y SIN cambiar su estado.
   * Se usa cuando el SMTP rechaza por límite de tasa: no es un error del
   * destinatario, así que debe volver a intentarse en el próximo ciclo.
   */
  async deferEmail(id: string, errorMessage: string) {
    return this.prisma.emailQueue.update({
      where: { id },
      data: {
        lastAttemptAt: new Date(),
        errorMessage,
      },
    });
  }

  /**
   * Correos efectivamente enviados desde el inicio del día del servidor.
   * Se usa para no superar el cupo diario del proveedor SMTP.
   */
  async countSentToday(now: Date = new Date()): Promise<number> {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.emailQueue.count({
      where: {
        status: EmailStatus.SENT,
        sentAt: { gte: startOfDay },
      },
    });
  }

  async getStats() {
    const [pending, sent, failed] = await Promise.all([
      this.prisma.emailQueue.count({
        where: { status: EmailStatus.PENDING },
      }),
      this.prisma.emailQueue.count({
        where: { status: EmailStatus.SENT },
      }),
      this.prisma.emailQueue.count({
        where: { status: EmailStatus.FAILED },
      }),
    ]);

    return { pending, sent, failed };
  }

  async getFailedEmails() {
    return this.prisma.emailQueue.findMany({
      where: {
        status: EmailStatus.FAILED,
      },
      orderBy: {
        lastAttemptAt: 'desc',
      },
      take: 100,
    });
  }

  async enqueueBulkEmails(
    subject: string,
    htmlContent: string,
    recipients: string[],
    emailType: EmailType = EmailType.CUSTOM,
  ) {
    const emailRecords = recipients.map((recipient) => ({
      to: recipient,
      subject: subject,
      html: htmlContent,
      emailType: emailType,
      status: EmailStatus.PENDING,
      attempts: 0,
    }));

    await this.prisma.emailQueue.createMany({
      data: emailRecords,
    });

    return {
      queued: recipients.length,
      recipients: recipients,
    };
  }
}
