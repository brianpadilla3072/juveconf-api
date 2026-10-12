/* eslint-disable prettier/prettier */
import { IsString, IsEmail, IsNumber, IsArray, IsOptional, ValidateNested, Matches, IsInt, Min, Max, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class MealPickDto {
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{1,19}$/)
  slotCode: string;

  @IsInt()
  @Min(1)
  @Max(9)
  optionNumber: number;
}

export class AttendeeDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^\d{7,11}$/) // opcional, valida formato de CUIL
  cuil: string;

  @IsOptional()
  @IsString()
  metadata?: string; // JSON string con: { email?, phone?, birthdate?, city?, church? }

  // Comidas elegidas (solo si el evento tiene comidas activadas)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => MealPickDto)
  meals?: MealPickDto[];
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
