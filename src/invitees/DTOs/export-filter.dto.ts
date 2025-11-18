/* eslint-disable prettier/prettier */
import { IsOptional, IsUUID, IsArray, IsBoolean } from 'class-validator';

export class ExportFilterDto {
  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  comboIds?: string[];

  @IsOptional()
  @IsBoolean()
  includeAttendance?: boolean;

  @IsOptional()
  @IsBoolean()
  includeMerchandising?: boolean;

  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;

  @IsOptional()
  @IsArray()
  selectedMetadataFields?: string[];

  @IsOptional()
  @IsArray()
  selectedMerchTypes?: string[];

  @IsOptional()
  @IsArray()
  selectedDays?: number[];

  @IsOptional()
  @IsArray()
  selectedAdditionalFields?: string[];
}

export interface ExportColumn {
  key: string;
  label: string;
  type: string;
  width?: number;
}

export interface ExportSchema {
  columns: ExportColumn[];
}

export interface ExportData {
  schema: ExportSchema;
  rows: Record<string, any>[];
}
