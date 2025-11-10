/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreatePreSaleDto } from './create-presale.dto';

export class UpdatePreSaleDto extends PartialType(CreatePreSaleDto) {}
