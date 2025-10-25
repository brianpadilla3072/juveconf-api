/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailQueueService } from './email-queue.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    private emailQueueService: EmailQueueService,
    private mailService: MailService,
  ) {}

  @Cron('0,30 * * * *') // Every 30 minutes (at minute 0 and 30)
  async processEmailQueue() {
    try {
      const pendingEmails = await this.emailQueueService.getPendingEmails(50);

      // Skip processing if no emails pending
      if (pendingEmails.length === 0) {
        return;
      }

      this.logger.log('Starting email queue processing...');
      this.logger.log(`Found ${pendingEmails.length} pending emails to process`);

      for (const email of pendingEmails) {
        try {
          // Check if email uses template or raw HTML
          if (email.template && email.context) {
            // Use template-based email
            await this.mailService.sendTemplate(
              email.template,
              [email.to],
              email.context as Record<string, any>,
              email.subject,
            );
          } else if (email.html) {
            // Use raw HTML email
            await this.mailService.sendCustomEmail(
              email.to,
              email.html,
              email.subject,
            );
          } else {
            throw new Error('Email has neither template nor HTML content');
          }

          await this.emailQueueService.markAsSent(email.id);
          this.logger.log(`Email ${email.id} sent successfully to ${email.to}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await this.emailQueueService.markAsFailed(email.id, errorMessage);
          this.logger.error(`Failed to send email ${email.id}: ${errorMessage}`);
        }
      }

      this.logger.log('Email queue processing completed');
    } catch (error) {
      this.logger.error('Error processing email queue:', error);
    }
  }

  // Manual trigger for admin use
  async triggerManualProcessing() {
    this.logger.log('Manual email queue processing triggered');
    return this.processEmailQueue();
  }
}
