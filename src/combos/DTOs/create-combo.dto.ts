/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNumber } from 'class-validator';

export class CreateComboDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;
}
