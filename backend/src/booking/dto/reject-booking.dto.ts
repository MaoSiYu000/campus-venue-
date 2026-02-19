import { IsString, MinLength } from 'class-validator';

export class RejectBookingDto {
  @IsString()
  @MinLength(1, { message: '驳回必须填写理由' })
  rejectReason: string;
}
