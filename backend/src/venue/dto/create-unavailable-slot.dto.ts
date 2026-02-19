import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateUnavailableSlotDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
