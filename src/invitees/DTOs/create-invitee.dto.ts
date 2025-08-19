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
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  paymentId?: string;
}
