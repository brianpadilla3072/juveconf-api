/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UsePipes, ValidationPipe, HttpException, HttpStatus, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';
import { MailService } from './mail.service';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { EmailType } from '@prisma/client';

class SendEmailDto {
  @IsString()
  @IsNotEmpty()
  template: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  to: string[];

  @IsObject()
  context: Record<string, any>;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];
}

class SendBulkEmailDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  recipients: string[];

  @IsOptional()
  @IsString()
  from?: string;
}

@ApiTags('Correo Electrónico')
@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    private readonly mailService: MailService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar correo con plantilla HTML' })
  @ApiResponse({ status: 200, description: 'Correo enviado con éxito' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o plantilla inexistente' })
  @ApiResponse({ status: 500, description: 'Error interno al enviar el correo' })
  @ApiBody({ type: SendEmailDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendTemplate(@Body() dto: SendEmailDto) {
    try {
      this.logger.log(`Enviando plantilla "${dto.template}" a ${dto.to.join(', ')}`);

      // Validar si la plantilla existe
      const availableTemplates = this.mailService.getTemplateNames?.();
      if (availableTemplates && !availableTemplates.includes(dto.template)) {
        throw new HttpException(`Plantilla no encontrada: ${dto.template}`, HttpStatus.BAD_REQUEST);
      }

      const result = await this.mailService.sendTemplate(
        dto.template,
        dto.to,
        dto.context,
        dto.subject,
        dto.attachments,
      );

      return {
        success: true,
        messageId: result?.messageId || null,
        recipients: dto.to,
      };
    } catch (error) {
      this.logger.error(`Error al enviar correo: ${error.message}`);
      throw new HttpException(
        error.message || 'Error interno al enviar el correo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('templates')
  @ApiOperation({ summary: 'Listar nombres de plantillas disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas disponibles' })
  getTemplates() {
    return this.mailService.getTemplateNames();
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Encolar emails masivos con HTML personalizado' })
  @ApiResponse({ status: 200, description: 'Emails encolados correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno al encolar emails' })
  @ApiBody({ type: SendBulkEmailDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendBulkEmail(@Body() dto: SendBulkEmailDto) {
    try {
      this.logger.log(`Encolando email masivo a ${dto.recipients.length} destinatarios`);

      const result = await this.emailQueueService.enqueueBulkEmails(
        dto.subject,
        dto.htmlContent,
        dto.recipients,
        EmailType.CUSTOM,
      );

      return {
        success: true,
        queued: result.queued,
        recipients: result.recipients,
        message: 'Emails encolados. Se procesarán en el próximo ciclo (cada hora)',
      };
    } catch (error) {
      this.logger.error(`Error al encolar emails masivos: ${error.message}`);
      throw new HttpException(
        error.message || 'Error interno al encolar emails masivos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
