import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @Length(1, 120)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsIn(['resident', 'dated'])
  scope?: 'resident' | 'dated';

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string | null;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  reminderTime?: string | null;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string | null;

  @IsOptional()
  @IsIn(['resident', 'dated'])
  scope?: 'resident' | 'dated';

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string | null;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  reminderTime?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ListTasksQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
