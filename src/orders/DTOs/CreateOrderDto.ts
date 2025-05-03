/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNotEmpty } from "class-validator";

export class CreateOrderDto {
    @IsNotEmpty()
    userId: number;
    @IsNotEmpty()
    comboIds: number[];
  }
  