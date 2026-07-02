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
  @IsIn(['resident', 'dated', 'weekly', 'monthly'])
  scope?: 'resident' | 'dated' | 'weekly' | 'monthly';

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string | null;

  /** 周任务: [0-6] 星期几; 月任务: [1-31] 每月几号 */
  @IsOptional()
  repeatDays?: number[] | null;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string | null;

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
  @IsIn(['resident', 'dated', 'weekly', 'monthly'])
  scope?: 'resident' | 'dated' | 'weekly' | 'monthly';

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string | null;

  @IsOptional()
  repeatDays?: number[] | null;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string | null;

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

export class SkipTaskDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
