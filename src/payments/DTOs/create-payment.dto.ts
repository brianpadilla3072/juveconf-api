/* eslint-disable prettier/prettier */
import { IsInt, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @IsInt()
  @IsNotEmpty()
  year: number;
  
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType;

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  payerName?: string;

  @IsOptional()
  @IsString()
  payerEmail?: string;

  @IsOptional()
  @IsString()
  payerDni?: string;
}