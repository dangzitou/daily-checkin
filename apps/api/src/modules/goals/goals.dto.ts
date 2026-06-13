import { IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @Length(1, 120)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  targetDate!: string;

  @IsInt()
  @Min(1)
  targetCount!: number;
}
