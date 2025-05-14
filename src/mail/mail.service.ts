/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserCreatedTemplate, PaymentReceivedTemplate, TicketDetailsTemplate, ResetPasswordTemplate, WelcomeMessageTemplate, EventConfirmationTemplate } from './templates'; // Importar las plantillas
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

  /**
   * Obtiene la plantilla según el nombre
   */
  private getTemplate(templateName: string): EmailTemplate {
    const templates: Record<string, EmailTemplate> = {
      userCreated: new UserCreatedTemplate(),
      paymentReceived: new PaymentReceivedTemplate(),
      ticketDetails: new TicketDetailsTemplate(),
      resetPassword: new ResetPasswordTemplate(),
      welcomeMessage: new WelcomeMessageTemplate(),
      eventConfirmation: new EventConfirmationTemplate(),
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
