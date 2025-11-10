import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class DashboardFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}
