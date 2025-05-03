/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { PartialType } from '@nestjs/mapped-types';
import { CreateComboDto } from './create-combo.dto';

export class UpdateComboDto extends PartialType(CreateComboDto) {}
