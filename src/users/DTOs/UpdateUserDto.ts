/* eslint-disable prettier/prettier */
import { UserRole, AuthProvider } from '@prisma/client';
import { IsString, IsEmail, MinLength, IsEnum, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El auth0Id debe ser un texto válido.' })
  auth0Id?: string;

  @IsOptional()
  @IsEnum(AuthProvider, { message: 'El proveedor de autenticación no es válido.' })
  provider?: AuthProvider;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de pila debe ser un texto.' })
  givenName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser un texto.' })
  familyName?: string;

  @IsOptional()
  @IsString({ message: 'El apodo debe ser un texto.' })
  nickname?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un correo válido.' })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: 'emailVerified debe ser true o false.' })
  emailVerified?: boolean;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de la imagen de perfil debe ser válida.' })
  picture?: string;

  @IsOptional()
  @IsString({ message: 'El locale debe ser un texto.' })
  locale?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser válido.' })
  role?: UserRole;

  @IsOptional()
  @IsString({ message: 'El DNI debe ser un texto.' })
  dni?: string;
}