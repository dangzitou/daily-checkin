import {
  Controller, Delete, Get, Inject, Param, Post, Patch, Query, Req, Body,
  UploadedFile, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/current-user';
import { CheckinsService } from './checkins.service';
import { UpdateCheckinDto, VALID_MOODS } from './dto/update-checkin.dto';
import { UploadService } from '../upload/upload.service';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function createPhotoStorage() {
  const photosDir = join(UPLOAD_DIR, 'photos');
  if (!existsSync(photosDir)) {
    mkdirSync(photosDir, { recursive: true });
  }
  return diskStorage({
    destination: (_req, _file, cb) => cb(null, photosDir),
    filename: (req, file, cb) => {
      const userId = ((req as unknown) as RequestWithUser).user.id;
      const taskId = req.params.id;
      const date = req.query.date || 'today';
      const ts = Date.now();
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${userId}_${taskId}_${date}_${ts}${ext}`);
    },
  });
}

@Controller()
@UseGuards(AuthGuard)
export class CheckinsController {
  constructor(
    @Inject(CheckinsService) private readonly checkins: CheckinsService,
    @Inject(UploadService) private readonly uploadService: UploadService,
  ) {}

  @Post('tasks/:id/checkins/today')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: createPhotoStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只支持 JPG/PNG/WebP/HEIC 格式的图片'), false);
        }
      },
    }),
  )
  async checkToday(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('mood') mood?: string,
    @Body('note') note?: string,
  ) {
    if (mood && !VALID_MOODS.includes(mood)) {
      throw new BadRequestException('心情值无效');
    }
    const photoPath = file ? this.uploadService.getPhotoUrl(file.filename) : undefined;
    return this.checkins.checkToday(request.user.id, Number(id), { photoPath, mood, note });
  }

  @Delete('tasks/:id/checkins/today')
  uncheckToday(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.checkins.uncheckToday(request.user.id, Number(id));
  }

  @Post('tasks/:id/checkins')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: createPhotoStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只支持 JPG/PNG/WebP/HEIC 格式的图片'), false);
        }
      },
    }),
  )
  async checkOnDate(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Query('date') date: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('mood') mood?: string,
    @Body('note') note?: string,
  ) {
    if (mood && !VALID_MOODS.includes(mood)) {
      throw new BadRequestException('心情值无效');
    }
    const photoPath = file ? this.uploadService.getPhotoUrl(file.filename) : undefined;
    return this.checkins.checkOnDate(request.user.id, Number(id), date, { photoPath, mood, note });
  }

  @Delete('tasks/:id/checkins')
  uncheckOnDate(@Req() request: RequestWithUser, @Param('id') id: string, @Query('date') date: string) {
    return this.checkins.uncheckOnDate(request.user.id, Number(id), date);
  }

  @Patch('checkins/:id')
  async updateCheckin(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCheckinDto,
  ) {
    return this.checkins.updateCheckin(request.user.id, Number(id), dto);
  }

  @Delete('checkins/:id/photo')
  async deletePhoto(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.checkins.deletePhoto(request.user.id, Number(id));
  }

  @Get('checkins/calendar')
  calendar(@Req() request: RequestWithUser, @Query('month') month: string) {
    return this.checkins.calendar(request.user.id, month);
  }
}
