/* eslint-disable prettier/prettier */
 
import { IsString, IsNumber, IsUUID, IsPositive, IsInt, Min } from 'class-validator';

export class CreateComboDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  @IsPositive()
  year: number;

  @IsInt()
  @Min(1)
  minPersons: number;

  @IsString()
  @IsUUID()
  eventId: string;
}
