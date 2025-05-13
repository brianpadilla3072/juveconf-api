/* eslint-disable prettier/prettier */
import { IsString, IsEmail, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttendeeDto {
  @IsString()
  name: string;

  @IsString()
  dni: string;
}

export class CreatePreferenceDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;
  @IsNumber()
  cuil:string

  @IsString()
  title: string;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  minPersons: number;

  @IsOptional()
  @IsNumber()
  maxPersons?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees: AttendeeDto[];

  @IsString()
  eventId: string;

  @IsOptional()
  @IsString()
  userId?:string
}
