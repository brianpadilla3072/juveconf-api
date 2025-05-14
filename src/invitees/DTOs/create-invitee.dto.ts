import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInviteeDto {
  @IsString()
  name: string;

  @IsString()
  cuil: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  paymentId?: string;
}
