import { IsString, IsBoolean, IsOptional, IsIn, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsBoolean()
  @Type(() => Boolean)
  isMustRead: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'venue_admin', 'all'])
  targetRole?: 'user' | 'venue_admin' | 'all'; // 必读公告的目标角色：学生/老师、场地管理员、全部
}
