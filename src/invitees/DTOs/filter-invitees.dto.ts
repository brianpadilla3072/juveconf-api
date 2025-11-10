/* eslint-disable prettier/prettier */
import { IsOptional, IsInt, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterInviteesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  comboId?: string;
}