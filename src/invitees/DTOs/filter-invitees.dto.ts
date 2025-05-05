/* eslint-disable prettier/prettier */
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterInviteesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}