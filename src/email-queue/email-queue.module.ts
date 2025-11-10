/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailQueueService } from './email-queue.service';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailQueueController } from './email-queue.controller';
import { PrismaService } from 'prisma/prisma.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => MailModule),
  ],
  controllers: [EmailQueueController],
  providers: [EmailQueueService, EmailQueueProcessor, PrismaService],
  exports: [EmailQueueService],
})
export class EmailQueueModule {}
