/* eslint-disable no-useless-catch */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly defaultFrom = '"JUVECONF" <equipo@juveconfe.com>';

  constructor(private readonly mailer: MailerService) {}

  /**
   * Envía un correo electrónico usando una plantilla Handlebars
   */
  async sendTemplate(
    templateName: string,
    to: string[],
    context: Record<string, any>,
    subject?: string,
    attachments?: any[],
  ) {
    try {
      const result = await this.mailer.sendMail({
        from: this.defaultFrom,
        to,
        subject: subject || this.resolveSubject(templateName),
        template: templateName, // Handlebars template name
        context, // Variables for the template
        attachments,
      });

      this.logger.log(`Correo enviado con éxito a ${to.join(', ')} usando plantilla ${templateName}`);
      return result;
    } catch (error) {
      this.logger.error(`Error al enviar correo usando plantilla ${templateName}: ${error.message}`);
      throw error;
    }
  }
  async sendCustomEmail(
    to: string,
    html: string,
    subject?: string,
    attachments?: any[],
  ) {
    try {
      const result = await this.mailer.sendMail({
        from: this.defaultFrom,
        to,
        subject: subject,
        html,
        attachments,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Envía emails masivos con HTML personalizado
   */
  async sendBulkHtml(
    subject: string,
    htmlContent: string,
    recipients: string[],
    from?: string
  ) {
    try {
      this.logger.log(`Enviando email masivo a ${recipients.length} destinatarios`);
      
      const results: Array<{ recipient: string; success: boolean; messageId?: any; error?: any }> = [];
      const batchSize = 10; // Enviar en lotes para evitar sobrecarga
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        this.logger.log(`Enviando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(recipients.length / batchSize)}`);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            const result = await this.mailer.sendMail({
              from: from || this.defaultFrom,
              to: recipient,
              subject: subject,
              html: htmlContent,
            });
            
            this.logger.log(`Email enviado exitosamente a ${recipient}`);
            return { recipient, success: true, messageId: result.messageId };
          } catch (error) {
            this.logger.error(`Error enviando email a ${recipient}: ${error.message}`);
            return { recipient, success: false, error: error.message };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Pequeña pausa entre lotes para no sobrecargar el servidor SMTP
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      this.logger.log(`Email masivo completado. Exitosos: ${successCount}, Fallidos: ${failureCount}`);
      
      return {
        totalSent: recipients.length,
        successful: successCount,
        failed: failureCount,
        results
      };
    } catch (error) {
      this.logger.error(`Error en envío masivo: ${error.message}`);
      throw error;
    }
  }
  /**
   * Resuelve el asunto del correo según la plantilla
   */
  private resolveSubject(templateName: string): string {
    const subjects = {
      'user-created': 'Bienvenido a JUVECONF 2025',
      'payment-received': 'Pago Recibido - JUVECONF 2025',
      'ticket-details': 'Tu entrada - JUVECONF 2025',
      'reset-password': 'Contraseña Temporal - JUVECONF 2025',
      'order-pending': 'Orden Creada - JUVECONF 2025',
    };
    return subjects[templateName] || 'Notificación JUVECONF';
  }

  /**
   * Devuelve los nombres de plantillas disponibles
   */
  public getTemplateNames(): string[] {
    return [
      'user-created',
      'payment-received',
      'ticket-details',
      'reset-password',
      'order-pending',
    ];
  }
}
