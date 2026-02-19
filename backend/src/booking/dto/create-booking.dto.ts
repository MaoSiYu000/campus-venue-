import { IsString, IsInt, IsOptional, IsNumber, MinLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsNumber()
  @Type(() => Number)
  venueId: number;

  @IsString()
  useDate: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsString()
  @MinLength(1)
  activityName: string;

  @IsString()
  @MinLength(1)
  organizer: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  estimatedPeople: number;

  @IsString()
  @MinLength(1)
  contactName: string;

  @IsString()
  @MinLength(1)
  contactPhone: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  proposalDocumentPath?: string;
}
