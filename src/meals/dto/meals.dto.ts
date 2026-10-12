/* eslint-disable prettier/prettier */
import { IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

const SLOT_CODE = /^[A-Z][A-Z0-9_]{1,19}$/;

export class UpdateMealConfigDto {
  @IsObject()
  mealConfig: Record<string, unknown>;
}

export class ScanMealDto {
  @IsOptional()
  @IsUUID()
  inviteeId?: string;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsString()
  @Matches(SLOT_CODE)
  slotCode: string;
}

export class DeliverMealDto {
  @IsUUID()
  inviteeId: string;

  @IsString()
  @Matches(SLOT_CODE)
  slotCode: string;
}

export class LookupMealDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  q: string;

  @IsString()
  @Matches(SLOT_CODE)
  slotCode: string;
}

export class AdminMealsQueryDto {
  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;
}
