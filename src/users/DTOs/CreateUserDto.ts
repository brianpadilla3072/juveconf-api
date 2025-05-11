/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UserRole , AuthProvider} from '@prisma/client';
import { IsNotEmpty, IsString, IsEmail, MinLength, IsEnum, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString({ message: 'El auth0Id debe ser un texto válido.' })
  auth0Id?: string;

  @IsOptional()
  @IsEnum(AuthProvider, { message: 'El proveedor de autenticación no es válido.' })
  provider?: AuthProvider = AuthProvider.LOCAL;

  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser un texto.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'El nombre de pila debe ser un texto.' })
  givenName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser un texto.' })
  familyName?: string;

  @IsOptional()
  @IsString({ message: 'El apodo debe ser un texto.' })
  nickname?: string;

  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @IsEmail({}, { message: 'Debe ser un correo válido.' })
  email: string;

  @IsOptional()
  @IsBoolean({ message: 'emailVerified debe ser true o false.' })
  emailVerified?: boolean;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de la imagen de perfil debe ser válida.' })
  picture?: string;

  @IsOptional()
  @IsString({ message: 'El locale debe ser un texto.' })
  locale?: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  @IsEnum(UserRole, { message: 'El rol debe ser válido.' })
  role: UserRole;

  @IsNotEmpty({ message: 'El DNI es obligatorio.' })
  @IsString({ message: 'El DNI debe ser un texto.' })
  dni: string;
}
