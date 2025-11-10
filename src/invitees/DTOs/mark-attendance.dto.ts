/* eslint-disable prettier/prettier */
import { IsInt, IsBoolean, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO DEPRECADO: Mantener temporalmente para retrocompatibilidad
 * Usar MarkAttendanceByDayDto para el nuevo sistema dinámico
 */
export class MarkAttendanceDto {
  @IsOptional()
  @IsBoolean()
  day1?: boolean;

  @IsOptional()
  @IsBoolean()
  day2?: boolean;
}

/**
 * DTO para marcar asistencia por número de día
 * Usa el nuevo sistema dinámico de días
 */
export class MarkAttendanceByDayDto {
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsBoolean()
  attended: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
