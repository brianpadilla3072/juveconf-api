/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsInt, IsString, Min } from 'class-validator';

export class CreatePreferenceDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  unit_price: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(1)
  minPersons: number;

  @IsInt()
  @Min(1)
  maxPersons: number;
}
