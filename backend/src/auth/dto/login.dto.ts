import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'venue_admin' | 'system_admin';

  @IsString()
  @IsNotEmpty()
  account: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
