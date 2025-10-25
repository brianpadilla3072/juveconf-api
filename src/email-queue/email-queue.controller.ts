/* eslint-disable prettier/prettier */
import { Controller, Get, Post, HttpCode, HttpStatus, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsObject, IsEnum, IsOptional } from 'class-validator';
import { EmailQueueService } from './email-queue.service';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailType } from '@prisma/client';

class EnqueueTemplateDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  template: string;

  @IsObject()
  @IsNotEmpty()
  context: Record<string, any>;

  @IsEnum(EmailType)
  emailType: EmailType;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;
}

@Controller('email-queue')
export class EmailQueueController {
  constructor(
    private readonly emailQueueService: EmailQueueService,
    private readonly emailQueueProcessor: EmailQueueProcessor,
  ) {}

  @Get('stats')
  async getStats() {
    return this.emailQueueService.getStats();
  }

  @Get('pending')
  async getPendingEmails() {
    return this.emailQueueService.getPendingEmails(100);
  }

  @Get('failed')
  async getFailedEmails() {
    return this.emailQueueService.getFailedEmails();
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  async triggerProcessing() {
    await this.emailQueueProcessor.triggerManualProcessing();
    return { message: 'Email queue processing triggered' };
  }

  @Post('enqueue-template')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async enqueueTemplate(@Body() dto: EnqueueTemplateDto) {
    const result = await this.emailQueueService.enqueueTemplateEmail(dto);
    return {
      success: true,
      emailId: result.id,
      message: 'Email enqueued successfully',
    };
  }
}
