import { IsString, IsInt, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVenueDto {
  @IsString()
  name: string;

  @IsString()
  venueType: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  capacity: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasProjector?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasSound?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isAvailable?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
