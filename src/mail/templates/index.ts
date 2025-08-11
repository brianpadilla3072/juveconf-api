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
       <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bienvenido</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #fffaf0;
            color: #2d3748;
          }
          .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            overflow: hidden;
            margin-top:2rem;
            display: flex;
            flex-direction: column;
            
          }
          .header {
            background: linear-gradient(90deg, #f97316 0%, #facc15 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header img {
            height: 60px;
            margin-bottom: 10px;
          }
          .content {
            padding: 30px 20px;
            line-height: 1.6;
          }
          .label {
            display: inline-block;
            font-weight: bold;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 6px;
            margin-bottom: 6px;
          }
          .cvu {
            background-color: #fef2f2;
            border: 1px dashed #f87171;
            color: #991b1b;
          }
          .alias {
            background-color: #fff7ed;
            border: 1px dashed #fb923c;
            color: #9a3412;
          }
          .button {
            display: inline-block;
            background: #f97316;
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            background-color: #fef9c3;
            text-align: center;
            padding: 15px;
            font-size: 13px;
            color: #78350f;
          }
        </style>
      </head>
      <body>
        <div class="container" >
          <div class="header">
            <img src="https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=50&q=80" alt="Logo" />
            <h1>¡Bienvenido, {{name}}!</h1>
            <p style="margin-top: 8px;">Nos alegra tenerte con nosotros</p>
          </div>
          <div class="content">
            <p>Hola {{name}},</p>
            <p>Gracias por sumarte a esta misión. Ya podés acceder al sistema y explorar las herramientas disponibles.</p>
            
            <div class="label cvu">Email de acceso</div>
            <p style="border: 1px dashed #f87171; padding: 10px; border-radius: 6px;">{{email}}</p>

            <a href="{{activationUrl}}" class="button">Activar cuenta</a>

            <p>Ante cualquier duda, estamos para ayudarte.</p>
          </div>
          <div class="footer">
            ¡Cada paso tuyo enciende una llama!<br/>
            Contactanos si necesitás asistencia: <a href="{{helpUrl}}">Centro de ayuda</a><br/>
            <a href="{{unsubscribeUrl}}">Cancelar suscripción</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
}


export class PaymentReceivedTemplate extends EmailTemplate {
  constructor() {
    super(`
     <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pago recibido</title>
        <style>
           body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #fffaf0;
            color: #2d3748;
          }
          .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            overflow: hidden;
            margin-top:2rem;
            display: flex;
            flex-direction: column;
            
          }
          .header {
            background: linear-gradient(90deg, #f97316 0%, #facc15 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header img {
            height: 60px;
            margin-bottom: 10px;
          }
          .content {
            padding: 30px 20px;
            line-height: 1.6;
          }
          .label {
            display: inline-block;
            font-weight: bold;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 6px;
            margin-bottom: 6px;
          }
          .cvu {
            background-color: #fef2f2;
            border: 1px dashed #f87171;
            color: #991b1b;
          }
          .alias {
            background-color: #fff7ed;
            border: 1px dashed #fb923c;
            color: #9a3412;
          }
          .button {
            display: inline-block;
            background: #f97316;
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            background-color: #fef9c3;
            text-align: center;
            padding: 15px;
            font-size: 13px;
            color: #78350f;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://i.imgur.com/XOqNrrD.png" alt="Pago confirmado" />
            <h1>¡Gracias por tu pago!</h1>
            <p style="margin-top: 8px;">Tu transacción fue exitosa</p>
          </div>
          <div class="content">
            <p>Hola {{name}},</p>
            <p>Hemos recibido correctamente tu pago de <strong>{{amount}}</strong>.</p>
            
            <div class="label amount">Monto pagado</div>
            <p style="border: 1px dashed #4ade80; padding: 10px; border-radius: 6px;">{{amount}}</p>

            <div class="label method">Método de pago</div>
            <p style="border: 1px dashed #a3e635; padding: 10px; border-radius: 6px;">{{paymentMethod}}</p>

            <a href="{{receiptUrl}}" class="button">Ver comprobante</a>

            <p>Gracias por tu apoyo. Cada aporte nos ayuda a crecer.</p>
          </div>
          <div class="footer">
            ¡Cada paso tuyo enciende una llama!<br/>
            ¿Tenés dudas? <a href="{{helpUrl}}">Centro de ayuda</a><br/>
            <a href="{{unsubscribeUrl}}">Cancelar suscripción</a>
          </div>
        </div>
      </body>
      </html>
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
     <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #fffaf0;
      color: #2d3748;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      overflow: hidden;
      margin-top:2rem;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: linear-gradient(90deg, #f97316 0%, #facc15 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header img {
      height: 60px;
      margin-bottom: 10px;
    }
    .content {
      padding: 30px 20px;
      line-height: 1.6;
    }
    .label {
      display: inline-block;
      font-weight: bold;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .cvu {
      background-color: #fef2f2;
      border: 1px dashed #f87171;
      color: #991b1b;
    }
    .button {
      display: inline-block;
      background: #f97316;
      color: white;
      padding: 12px 24px;
      border-radius: 10px;
      text-decoration: none;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      background-color: #fef9c3;
      text-align: center;
      padding: 15px;
      font-size: 13px;
      color: #78350f;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://i.imgur.com/LNnENaP.png" alt="Restablecer contraseña" />
      <h1>¿Olvidaste tu contraseña?</h1>
      <p style="margin-top: 8px;">Te ayudamos a recuperarla</p>
    </div>
    <div class="content">
      <p>Hola {{name}},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste vos, hacé clic en el botón de abajo para crear una nueva contraseña.</p>

      <a href="{{resetPasswordUrl}}" class="button">Restablecer contraseña</a>

      <p>Si no fuiste vos, podés ignorar este mensaje. Tu contraseña actual sigue siendo segura.</p>
    </div>
    <div class="footer">
      ¡Cuidamos tu seguridad en cada paso!<br/>
      ¿Necesitás ayuda? <a href="{{helpUrl}}">Centro de ayuda</a><br/>
      <a href="{{unsubscribeUrl}}">Cancelar suscripción</a>
    </div>
  </div>
</body>
</html>

    `);
  }
}


