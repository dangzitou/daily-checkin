import {
  Controller, Delete, Get, Inject, Param, Post, Query, Req, Body,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/current-user';
import { FeedService } from './feed.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('feed')
@UseGuards(AuthGuard)
export class FeedController {
  constructor(@Inject(FeedService) private readonly feed: FeedService) {}

  @Get('today')
  getTodayFeed(
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feed.getTodayFeed(
      req.user.id,
      Math.max(1, Number(page) || 1),
      Math.min(50, Math.max(1, Number(limit) || 20)),
    );
  }

  @Post('checkins/:id/like')
  toggleLike(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.feed.toggleLike(req.user.id, id);
  }

  @Get('checkins/:id/comments')
  getComments(@Param('id', ParseIntPipe) id: number) {
    return this.feed.getComments(id);
  }

  @Post('checkins/:id/comments')
  addComment(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.feed.addComment(req.user.id, id, dto.content);
  }

  @Delete('comments/:id')
  deleteComment(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.feed.deleteComment(req.user.id, id);
  }
}
