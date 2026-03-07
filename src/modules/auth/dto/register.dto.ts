import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
