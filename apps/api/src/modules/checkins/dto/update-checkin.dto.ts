import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

const VALID_MOODS = ['😊', '😐', '😔', '😤', '😴'];

export class UpdateCheckinDto {
  @IsOptional()
  @IsString()
  @IsIn(VALID_MOODS, { message: '心情值无效' })
  mood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '小记最多500字' })
  note?: string;
}

export { VALID_MOODS };
