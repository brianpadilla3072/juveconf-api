/* eslint-disable prettier/prettier */
 
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PaymentType } from '@prisma/client'; 

export class CreateOrderDto {
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  comboIds: string[];
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType; 
  @IsNotEmpty()
  @IsInt()
  year: number; 
  @IsNotEmpty()
  @IsInt()
  eventId: string; 
  @IsOptional()
  @IsString()
  preferenceId?:string
  @IsString()
  email:string
  @IsString()
  cuil:string
}
