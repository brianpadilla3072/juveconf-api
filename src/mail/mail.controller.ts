/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get } from '@nestjs/common';
import { MailService } from './mail.service';

interface SendEmailDto {
  template: string;
  to: string[];
  context: Record<string, any>;
  subject?: string;
}
interface RawEmailDto {
    html: string;
    to: string[];
    subject: string;
  }
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async send(@Body() dto: SendEmailDto) {
    await this.mailService.sendTemplate(
      dto.template,
      dto.to,
      dto.context,
      dto.subject,
    );
    return { success: true };
  }
  @Post('raw')
  async sendRaw(@Body() dto: RawEmailDto) {
    await this.mailService.sendRaw(dto.to, dto.subject, dto.html);
    return { success: true };
  }
  @Get('templates')
  async getTemplates(): Promise<string[]> {
    return this.mailService.getTemplateNames();
  }
}

