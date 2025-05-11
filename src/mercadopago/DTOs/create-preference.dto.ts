/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsEmail, IsNumber, IsArray, IsOptional } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePreferenceDto {
  @IsString()
  id: string;
  eventId: string
  paymentType:PaymentType
  @IsEmail()
  email: string;

  @IsString()
  title: string;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  minPersons: number;

  @IsNumber()
  maxPersons: number;

  @IsArray()
  attendees: any[];
  @IsOptional()
  userId?: string | null
}
