import { BadRequestException } from '@nestjs/common';
import { validateIsoDate } from '../domain/task-visibility';

/**
 * 校验 ISO 日期字符串，不合法时抛出 BadRequestException。
 */
export function validateIsoDateForRequest(date: string): string {
  try {
    return validateIsoDate(date);
  } catch {
    throw new BadRequestException('日期格式不正确');
  }
}
