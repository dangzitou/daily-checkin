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
    const filepath = join(UPLOAD_DIR, 'photos', filename);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }
  }

  extractFilenameFromUrl(url: string): string | null {
    const match = url.match(/\/api\/uploads\/photos\/(.+)$/);
    return match ? match[1] : null;
  }
}
