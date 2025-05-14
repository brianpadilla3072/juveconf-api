/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
  const user = config.get('MAIL_USER');
  const pass = config.get('MAIL_PASSWORD');
  console.log('MAIL_USER:', user);
  console.log('MAIL_PASSWORD:', pass ? '****' : 'NOT FOUND');

  return {
    transport: {
      host: config.get('MAIL_HOST'),
      secure: false,
      port: config.get('MAIL_PORT'),
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    },
    defaults: {
      from: '"Consagrados a Jesús" <equipo@consagradosajesus.com>',
    },
    template: {
      dir: join(__dirname, 'templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  };
}

    }),
  ],
  providers: [MailService],
   controllers: [MailController],
  exports: [MailService],
})
export class MailModule {}