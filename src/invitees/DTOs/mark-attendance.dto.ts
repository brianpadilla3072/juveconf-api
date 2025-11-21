/* eslint-disable prettier/prettier */
import { IsInt, IsBoolean, IsOptional, IsString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DayAttendanceDto {
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsBoolean()
  attended: boolean;
}

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

export class MarkAttendanceBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayAttendanceDto)
  days: DayAttendanceDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
