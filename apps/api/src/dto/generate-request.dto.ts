import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class GenerateRequestDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsOptional()
  @IsBoolean()
  includeImage?: boolean;

  @IsOptional()
  @IsString()
  imageProvider: 'dalle';
}