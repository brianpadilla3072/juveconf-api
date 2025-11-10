/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module, forwardRef } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
  imports: [
    forwardRef(() => EmailQueueModule),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
  const user = config.get('MAIL_USER');
  const pass = config.get('MAIL_PASS'); // Changed from MAIL_PASSWORD to MAIL_PASS
  const port = config.get('MAIL_PORT');
  console.log('MAIL_USER:', user);
  console.log('MAIL_PASS:', pass ? '****' : 'NOT FOUND');
  console.log('MAIL_PORT:', port);

  return {
    transport: `smtps://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${config.get('MAIL_HOST')}:${port}`,
    defaults: {
      from: `"JUVECONF" <${user}>`,
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