/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEnum, IsInt, IsNotEmpty } from "class-validator";
import { PaymentType } from '@prisma/client'; 

export class CreateOrderDto {
  @IsNotEmpty()
  userId: number;
  @IsNotEmpty()
  comboIds: number[];
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType; 
  @IsNotEmpty()
  @IsInt()
  year: number; 
  @IsNotEmpty()
  @IsInt()
  eventId: number; 
}
