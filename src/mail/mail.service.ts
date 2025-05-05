/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendTemplate(
    template: string,
    to: string[],
    context: Record<string, any>,
    subject?: string,
  ) {
    return this.mailer.sendMail({
      to,
      subject: subject || this.resolveSubject(template),
      template,
      context,
    });
  }
  async sendRaw(to: string[], subject: string, html: string) {
    await this.mailer.sendMail({
      from: '"No Reply" <no-reply@consagradosajesus.com>',
      to: 'no-reply@consagradosajesus.com', // destinatario visible (puede ser cualquiera)
      bcc: to, // destinatarios reales ocultos
      subject,
      html,
    });
  }
  async getTemplateNames(): Promise<string[]> {
    const templatesDir = path.join(__dirname, 'templates');
    const files = await fs.promises.readdir(templatesDir);
    return files
      .filter((file) => file.endsWith('.hbs'))
      .map((file) => path.basename(file, '.hbs'));
  }

  private resolveSubject(template: string): string {
    const subjects = {
      userCreated: 'Usuario Creado con Éxito',
      paymentReceived: 'Su Pago Ha Sido Procesado',
      ticketDetails: 'Detalles de Su Ticket',
    };
    return subjects[template] || 'Notificación Consagrados a Jesús';
  }

}