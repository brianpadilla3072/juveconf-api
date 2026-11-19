/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailQueueService } from './email-queue.service';
import { MailService } from 'src/mail/mail.service';
import {
  isRateLimitError,
  loadEmailSendingPolicy,
  sleep,
} from './email-sending-policy';

@Injectable()
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);
  private readonly policy = loadEmailSendingPolicy();

  /** Evita que el cron y el trigger manual se pisen enviando dos lotes. */
  private processing = false;

  /**
   * Hasta cuándo se considera al SMTP "en pausa" tras un límite de tasa.
   * En memoria: se reinicia con el proceso (aceptable; un reinicio ya
   * implica unos minutos sin envíos).
   */
  private pausedUntil = 0;

  constructor(
    private emailQueueService: EmailQueueService,
    private mailService: MailService,
  ) {}

  /**
   * Normaliza nombres de templates para manejar legacy data
   * Mapea nombres de enum (TICKET_DOWNLOAD) a nombres de archivo (ticket-details)
   */
  private normalizeTemplateName(templateName: string): string {
    const templateMap: Record<string, string> = {
      'TICKET_DOWNLOAD': 'ticket-details',
      'PASSWORD_RESET': 'reset-password',
      'ORDEN_TRANSFER': 'order-pending',
      'ORDEN_CASH': 'order-pending',
    };

    return templateMap[templateName] || templateName;
  }

  @Cron('0,30 * * * *') // Every 30 minutes (at minute 0 and 30)
  async processEmailQueue() {
    if (this.processing) {
      this.logger.warn('Ciclo de emails omitido: otro ciclo está en curso.');
      return;
    }

    const now = Date.now();
    if (now < this.pausedUntil) {
      const minutos = Math.ceil((this.pausedUntil - now) / 60_000);
      this.logger.warn(
        `Ciclo de emails omitido: SMTP en pausa por límite de tasa (~${minutos} min restantes).`,
      );
      return;
    }

    this.processing = true;
    try {
      // Cupo diario: nunca superar el máximo aunque haya miles en pending.
      const sentToday = await this.emailQueueService.countSentToday();
      const cupo = this.policy.maxPerDay - sentToday;
      if (cupo <= 0) {
        this.logger.warn(
          `Cupo diario de emails agotado (${sentToday}/${this.policy.maxPerDay}). ` +
          `Se reanuda mañana. Quedan ${await this.pendingCount()} en la cola.`,
        );
        return;
      }

      const batchSize = Math.min(this.policy.maxPerRun, cupo);
      const pendingEmails = await this.emailQueueService.getPendingEmails(batchSize);

      if (pendingEmails.length === 0) {
        return;
      }

      this.logger.log(
        `Procesando ${pendingEmails.length} emails ` +
        `(lote máx ${this.policy.maxPerRun}, cupo hoy ${cupo}/${this.policy.maxPerDay}, ` +
        `pausa ${this.policy.delayMs}ms).`,
      );

      for (let i = 0; i < pendingEmails.length; i++) {
        const email = pendingEmails[i];
        try {
          await this.sendOne(email);
          await this.emailQueueService.markAsSent(email.id);
          this.logger.log(`Email ${email.id} enviado a ${email.to}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (isRateLimitError(errorMessage)) {
            // No quemar intentos: el correo sigue PENDING y vuelve en el próximo ciclo.
            await this.emailQueueService.deferEmail(email.id, errorMessage);
            this.pausedUntil = Date.now() + this.policy.cooldownMs;
            const restantes = pendingEmails.length - i - 1;
            this.logger.error(
              `SMTP_LIMIT: "${errorMessage}". Envío pausado por ` +
              `${this.policy.cooldownMs / 60_000} min. ` +
              `${restantes} correos de este lote quedan para el próximo ciclo. ` +
              `Revisar el anti-spam del proveedor SMTP.`,
            );
            break; // Circuit breaker: no seguir martillando al SMTP.
          }

          await this.emailQueueService.markAsFailed(email.id, errorMessage);
          this.logger.error(`Failed to send email ${email.id}: ${errorMessage}`);
        }

        // Espaciar envíos para no disparar la detección de actividad inusual.
        if (i < pendingEmails.length - 1) {
          await sleep(this.policy.delayMs);
        }
      }

      this.logger.log('Email queue processing completed');
    } catch (error) {
      this.logger.error('Error processing email queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /** Envía un correo; lanza si no hay contenido o si el SMTP falla. */
  private async sendOne(email: {
    id: string;
    template: string | null;
    context: unknown;
    html: string | null;
    to: string;
    subject: string;
  }): Promise<void> {
    if (email.template && email.context) {
      const normalizedTemplate = this.normalizeTemplateName(email.template);

      if (normalizedTemplate !== email.template) {
        this.logger.warn(
          `Template name normalized: "${email.template}" -> "${normalizedTemplate}" for email ${email.id}`,
        );
      }

      await this.mailService.sendTemplate(
        normalizedTemplate,
        [email.to],
        email.context as Record<string, any>,
        email.subject,
      );
      return;
    }

    if (email.html) {
      await this.mailService.sendCustomEmail(email.to, email.html, email.subject);
      return;
    }

    throw new Error('Email has neither template nor HTML content');
  }

  private async pendingCount(): Promise<number> {
    const stats = await this.emailQueueService.getStats();
    return stats.pending;
  }

  // Manual trigger for admin use. Respeta la misma política que el cron.
  async triggerManualProcessing() {
    this.logger.log('Manual email queue processing triggered');
    return this.processEmailQueue();
  }
}
