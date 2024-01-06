import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Passwords must be at least 8 characters long' })
  password: string;
}
