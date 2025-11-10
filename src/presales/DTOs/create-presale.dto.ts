/* eslint-disable prettier/prettier */
import { IsString, IsUUID, IsDateString, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class PreSaleComboPriceDto {
  @IsUUID()
  comboId: string;

  @IsNumber()
  @IsPositive()
  price: number;
}

export class CreatePreSaleDto {
  @IsUUID()
  eventId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreSaleComboPriceDto)
  comboPrices: PreSaleComboPriceDto[];
}
