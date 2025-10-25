import { IsOptional, IsString, IsUUID, IsEmail } from 'class-validator';

export class CreateInviteeDto {
  @IsString()
  name: string;

  @IsString()
  cuil: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  metadata?: string; // JSON string con metadata adicional (birthdate, city, church, etc)

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  paymentId?: string;
}
