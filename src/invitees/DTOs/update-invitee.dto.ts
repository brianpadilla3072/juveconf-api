import { PartialType } from '@nestjs/mapped-types';
import { CreateInviteeDto } from './create-invitee.dto';

export class UpdateInviteeDto extends PartialType(CreateInviteeDto) {}
