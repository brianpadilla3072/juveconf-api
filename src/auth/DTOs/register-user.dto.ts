import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  givenName?: string;

  @IsString()
  @IsOptional()
  familyName?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.USER;
}
