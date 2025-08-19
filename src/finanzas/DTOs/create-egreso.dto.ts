import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsInt } from 'class-validator';

export class CreateEgresoDto {
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  concepto: string;

  @IsNumber()
  monto: number;

  @IsString()
  @IsNotEmpty()
  metodoPago: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsInt()
  year: number;
}