import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class ColorsDto {
  @IsOptional()
  @IsString()
  primary?: string;

  @IsOptional()
  @IsString()
  secondary?: string;

  @IsOptional()
  @IsString()
  accent?: string;
}

export class FontsDto {
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class LayoutDto {
  @IsOptional()
  @IsString()
  spacing?: string;

  @IsOptional()
  @IsString()
  alignment?: string;
}

export class BrandDto {
  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  watermark?: boolean;
}

export class SettingsDto {
  @IsOptional()
  @IsObject()
  colors?: ColorsDto;

  @IsOptional()
  @IsObject()
  fonts?: FontsDto;

  @IsOptional()
  @IsObject()
  layout?: LayoutDto;

  @IsOptional()
  @IsObject()
  brand?: BrandDto;
}

export class SettingsResponseDto {
  colors: ColorsDto;
  fonts: FontsDto;
  layout: LayoutDto;
  brand: BrandDto;
  timestamp: string;
}