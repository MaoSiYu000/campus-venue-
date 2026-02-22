import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  college?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  major?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  class?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar?: string;
}
