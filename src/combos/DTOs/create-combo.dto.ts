/* eslint-disable prettier/prettier */

import { IsString, IsNumber, IsUUID, IsPositive, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateComboDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  personsIncluded: number;

  @IsString()
  @IsUUID()
  eventId: string;

  // Nuevos campos opcionales
  @IsOptional()
  @IsInt()
  @IsPositive()
  maxPersons?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  // Permite elegir comidas al comprar este combo (requiere la configuracion de comidas del evento)
  @IsOptional()
  @IsBoolean()
  mealsEnabled?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  metadata?: any; // JSON field
}
