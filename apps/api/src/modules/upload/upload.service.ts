import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

@Injectable()
export class UploadService {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  getUploadDir(): string {
    return UPLOAD_DIR;
  }

  getPhotoUrl(filename: string): string {
    return `/api/uploads/photos/${filename}`;
  }

  deletePhoto(filename: string): void {
    // 防止路径穿越攻击：只允许纯文件名，不含路径分隔符
    const sanitized = this.sanitizeFilename(filename);
    if (!sanitized) return;
    const filepath = join(UPLOAD_DIR, 'photos', sanitized);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }
  }

  extractFilenameFromUrl(url: string): string | null {
    const match = url.match(/\/api\/uploads\/photos\/(.+)$/);
    if (!match) return null;
    return this.sanitizeFilename(match[1]);
  }

  /** 校验文件名：拒绝路径穿越和空文件名 */
  private sanitizeFilename(name: string): string | null {
    if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
      return null;
    }
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
