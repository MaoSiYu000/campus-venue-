import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateScopeDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  venueIds: number[];
}
