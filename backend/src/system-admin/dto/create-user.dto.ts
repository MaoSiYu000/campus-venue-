import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  name?: string;

  /** 初始密码，不填则默认 123456 */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password?: string;
}
