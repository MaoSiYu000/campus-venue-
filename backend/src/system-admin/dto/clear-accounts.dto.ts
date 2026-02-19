import { IsBoolean, IsArray, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ClearAccountsDto {
  /** 为 true 时只保留测试账号（学号2024001、工号va001），其余删除 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  keepTestOnly?: boolean;

  /** 为 true 时完全清空（不保留测试账号） */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  clearAll?: boolean;

  /** 清空范围：仅学生/老师、仅场地管理员、或全部。与 keepTestOnly/clearAll 配合使用 */
  @IsOptional()
  @IsIn(['users', 'venue_admins', 'both'])
  clearScope?: 'users' | 'venue_admins' | 'both';

  /** 要删除的学生/老师 id 列表（筛选清空） */
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  userIds?: number[];

  /** 要删除的场地管理员 id 列表（筛选清空） */
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  venueAdminIds?: number[];
}
