import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(2, 64)
  username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(6, 100)
  password!: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @Length(6, 100)
  password!: string;
}
