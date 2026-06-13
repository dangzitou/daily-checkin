import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePrizeDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @Min(1)
  pointsCost!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdatePrizeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  pointsCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  isActive?: boolean;
}
