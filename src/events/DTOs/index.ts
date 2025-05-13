/* eslint-disable prettier/prettier */
import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsInt, IsString } from "class-validator";

export class CreateEventDto {
  @IsInt()
  year: number;

  @IsString()
  topic: string;

  @IsInt()
  capacity: number;

  @IsDateString()
  salesStartDate: string;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
