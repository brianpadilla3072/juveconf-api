/* eslint-disable prettier/prettier */
import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsInt, IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateEventDto {
  @IsInt()
  year: number;

  @IsString()
  topic: string;

  @IsInt()
  capacity: number;

  @IsDateString()
  salesStartDate: string;

  // Nuevos campos opcionales
  @IsOptional()
  @IsDateString()
  salesEndDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Fechas del evento (NO de ventas)
  @IsOptional()
  @IsDateString()
  eventStartDate?: string;

  @IsOptional()
  @IsDateString()
  eventEndDate?: string;

  // Este campo se genera automáticamente, no debe ser enviado por el usuario
  // @IsOptional()
  // eventDays?: any;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
