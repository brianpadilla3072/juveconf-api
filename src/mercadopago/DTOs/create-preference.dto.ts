/* eslint-disable prettier/prettier */
import { IsString, IsEmail, IsNumber, IsArray, IsOptional, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendeeDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^\d{7,11}$/) // opcional, valida formato de CUIL
  cuil: string;
}

export class CreatePreferenceDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;
  
  @IsString()
  @Matches(/^\d{7,11}$/)
  cuil: string;

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
  userId?: string
}
