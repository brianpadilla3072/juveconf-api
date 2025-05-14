/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
interface TemplateContext {
  [key: string]: any;
}

export class EmailTemplate {
  protected template: string;

  constructor(template: string) {
    this.template = template;
  }

  render(context: TemplateContext): string {
    return this.template.replace(/{{(.*?)}}/g, (_, key) => context[key.trim()] || '');
  }
}

export class UserCreatedTemplate extends EmailTemplate {
  constructor() {
    super(`
      <h1>¡Bienvenido!</h1>
      <p>Hola {{name}},</p>
      <p>Tu cuenta ha sido creada con éxito. Ahora puedes acceder a nuestro portal.</p>
    `);
  }
}

export class PaymentReceivedTemplate extends EmailTemplate {
  constructor() {
    super(`
      <h1>¡Gracias por tu pago!</h1>
      <p>Estimado {{name}}, hemos recibido tu pago de {{amount}}.</p>
      <p>Tu transacción ha sido procesada correctamente.</p>
    `);
  }
}

export class TicketDetailsTemplate extends EmailTemplate {
  constructor() {
    super(`
      <h1>Detalles de tu ticket</h1>
      <p>Estimado {{name}},</p>
      <p>Has creado un ticket con el siguiente detalle:</p>
      <p>Ticket #: {{ticketId}}</p>
      <p>Descripción: {{description}}</p>
    `);
  }
}

export class ResetPasswordTemplate extends EmailTemplate {
  constructor() {
    super(`
      <h1>Recuperación de Contraseña</h1>
      <p>Hola {{name}},</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña: <a href="{{resetLink}}">Restablecer Contraseña</a></p>
    `);
  }
}

export class WelcomeMessageTemplate extends EmailTemplate {
  constructor() {
    super(`
      <h1>Bienvenido a Consagrados a Jesús</h1>
      <p>Hola {{name}},</p>
      <p>Nos alegra tenerte con nosotros. Gracias por unirte a nuestra comunidad.</p>
    `);
  }
}

export class EventConfirmationTemplate extends EmailTemplate {
  constructor() {
    super(`
      <h1>Confirmación de Evento</h1>
      <p>Hola {{name}},</p>
      <p>Tu registro para el evento "{{eventName}}" ha sido confirmado. ¡Nos vemos pronto!</p>
    `);
  }
}
