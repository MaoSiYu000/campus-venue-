import { IsString, IsInt, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SendNotificationDto {
  @IsInt()
  @Type(() => Number)
  targetId: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;
}
