import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsNumber()
  @Min(256)
  @Max(2048)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(256)
  @Max(2048)
  height?: number;

  @IsOptional()
  @IsString()
  @IsIn(['standard', 'hd'])
  quality?: string;

  @IsOptional()
  @IsString()
  provider: 'dalle';

  @IsOptional()
  @IsString()
  @IsIn(['vivid', 'natural'])
  style?: string;
}