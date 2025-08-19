/* eslint-disable no-useless-catch */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserCreatedTemplate, PaymentReceivedTemplate, TicketDetailsTemplate, ResetPasswordTemplate } from './templates'; // Importar las plantillas
import { EmailTemplate } from './templates';
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly defaultFrom = '"Consagrados a Jesús" <equipo@consagradosajesus.com>';

  constructor(private readonly mailer: MailerService) {}

  /**
   * Envía un correo electrónico usando una plantilla
   */
  async sendTemplate(
    templateName: string,
    to: string[],
    context: Record<string, any>,
    subject?: string,
    attachments?: any[],
  ) {
    try {
      // Instanciar la plantilla correspondiente
      const template = this.getTemplate(templateName);
      const html = template.render(context);

      const result = await this.mailer.sendMail({
        from: this.defaultFrom,
        to,
        subject: subject || this.resolveSubject(templateName),
        html,
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
   * Obtiene la plantilla según el nombre
   */
  private getTemplate(templateName: string): EmailTemplate {
    const templates: Record<string, EmailTemplate> = {
      userCreated: new UserCreatedTemplate(),
      paymentReceived: new PaymentReceivedTemplate(),
      ticketDetails: new TicketDetailsTemplate(),
      resetPassword: new ResetPasswordTemplate(),
   
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Plantilla no encontrada: ${templateName}`);
    }
    return template;
  }

  /**
   * Resuelve el asunto del correo según la plantilla
   */
  private resolveSubject(templateName: string): string {
    const subjects = {
      userCreated: 'Usuario Creado con Éxito',
      paymentReceived: 'Su Pago Ha Sido Procesado',
      ticketDetails: 'Detalles de Su Ticket',
      resetPassword: 'Recuperación de Contraseña',
      welcomeMessage: 'Bienvenido a Consagrados a Jesús',
      eventConfirmation: 'Confirmación de Evento',
    };
    return subjects[templateName] || 'Notificación Consagrados a Jesús';
  }
  /**
 * Devuelve los nombres de plantillas disponibles
 */
public getTemplateNames(): string[] {
  return [
    'userCreated',
    'paymentReceived',
    'ticketDetails',
    'resetPassword',
    'welcomeMessage',
    'eventConfirmation',
  ];
}
}
