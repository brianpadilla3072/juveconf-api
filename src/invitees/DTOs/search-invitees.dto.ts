import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class SearchInviteesDto {
  @IsString()
  @MinLength(2)
  q: string; // Search query (nombre, CUIL, email)

  @IsOptional()
  @IsUUID()
  eventId?: string;
}
