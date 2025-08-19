/* eslint-disable prettier/prettier */
// src/payments/payments.controller.ts
// src/payments/payments.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './DTOs';
import { DashboardFilterDto } from './DTOs/dashboard-filter.dto';
import { PaymentType } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  // Dashboard endpoints
  @Get('dashboard/summary')
  getDashboardSummary(@Query() filters: DashboardFilterDto) {
    return this.paymentsService.getDashboardSummary(filters);
  }

  @Get('dashboard/by-type')
  getPaymentsByType(@Query('type') paymentType?: PaymentType) {
    return this.paymentsService.getPaymentsByType(paymentType);
  }

  @Get('dashboard/by-date-range')
  getPaymentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentsService.getPaymentsByDateRange(startDate, endDate);
  }

  @Get('dashboard/recent')
  getRecentPayments(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.paymentsService.getRecentPayments(limitNumber);
  }

  @Get('dashboard/statistics')
  getPaymentStatistics() {
    return this.paymentsService.getPaymentStatistics();
  }

  @Get('emails/list')
  getPaymentsEmails() {
    return this.paymentsService.getPaymentsEmails();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }

  @Get(':paymentId/invitees')
  getPaymentWithInvitees(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentWithInvitees(paymentId);
  }
}
