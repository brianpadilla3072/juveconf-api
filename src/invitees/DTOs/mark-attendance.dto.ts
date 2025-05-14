import { IsOptional, IsBoolean } from 'class-validator';

export class MarkAttendanceDto {
  @IsOptional()
  @IsBoolean()
  day1?: boolean;

  @IsOptional()
  @IsBoolean()
  day2?: boolean;
}
