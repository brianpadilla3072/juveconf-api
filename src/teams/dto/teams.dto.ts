/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PlayerDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MaxLength(60)
  firstName: string;

  @IsString()
  @MaxLength(60)
  lastName: string;
}

export class CreateTeamDto {
  @IsUUID()
  teamTypeId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  leaderName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  leaderPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  leaderEmail?: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PlayerDto)
  players: PlayerDto[];
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  leaderName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  leaderPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  leaderEmail?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PlayerDto)
  players?: PlayerDto[];
}

export class CreateTeamTypeDto {
  @IsUUID()
  eventId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeams?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class UpdateTeamTypeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeams?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class TeamsQueryDto {
  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsUUID()
  teamTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;
}

export class EventQueryDto {
  @IsUUID()
  eventId: string;
}
