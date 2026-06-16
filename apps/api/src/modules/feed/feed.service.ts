import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { todayInShanghai } from '../../domain/dates';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayFeed(userId: number, page = 1, limit = 20) {
    const today = todayInShanghai();
    const skip = (page - 1) * limit;

    const [checkins, total] = await Promise.all([
      this.prisma.checkin.findMany({
        where: { checkinDate: today },
        include: {
          user: { select: { id: true, username: true } },
          task: { select: { id: true, title: true } },
          likes: { select: { userId: true } },
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { user: { select: { id: true, username: true } } },
          },
        },
        orderBy: { checkedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkin.count({ where: { checkinDate: today } }),
    ]);

    // Batch fetch comment counts
    const checkinIds = checkins.map((c) => c.id);
    const commentCounts = checkinIds.length
      ? await this.prisma.comment.groupBy({
          by: ['checkinId'],
          where: { checkinId: { in: checkinIds } },
          _count: { id: true },
        })
      : [];
    const commentCountMap = new Map(commentCounts.map((cc) => [cc.checkinId, cc._count.id]));

    const items = checkins.map((c) => ({
      id: c.id,
      userId: c.userId,
      username: c.user.username,
      taskId: c.taskId,
      taskTitle: c.task.title,
      checkinDate: c.checkinDate,
      checkedAt: c.checkedAt,
      photoUrl: c.photoUrl,
      mood: c.mood,
      note: c.note,
      likeCount: c.likes.length,
      likedByMe: c.likes.some((l) => l.userId === userId),
      commentCount: commentCountMap.get(c.id) ?? 0,
      comments: c.comments.reverse().map((cm) => ({
        id: cm.id,
        userId: cm.userId,
        username: cm.user.username,
        content: cm.content,
        createdAt: cm.createdAt,
      })),
    }));

    return { items, total, page, hasMore: skip + limit < total };
  }

  async toggleLike(userId: number, checkinId: number) {
    const checkin = await this.prisma.checkin.findUnique({ where: { id: checkinId } });
    if (!checkin) throw new NotFoundException('打卡记录不存在');

    const existing = await this.prisma.like.findUnique({
      where: { userId_checkinId: { userId, checkinId } },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await this.prisma.like.create({ data: { userId, checkinId } });
    return { liked: true };
  }

  async getComments(checkinId: number) {
    const checkin = await this.prisma.checkin.findUnique({ where: { id: checkinId } });
    if (!checkin) throw new NotFoundException('打卡记录不存在');

    return this.prisma.comment.findMany({
      where: { checkinId },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(userId: number, checkinId: number, content: string) {
    const checkin = await this.prisma.checkin.findUnique({ where: { id: checkinId } });
    if (!checkin) throw new NotFoundException('打卡记录不存在');

    const comment = await this.prisma.comment.create({
      data: { userId, checkinId, content },
      include: { user: { select: { id: true, username: true } } },
    });

    return {
      id: comment.id,
      userId: comment.userId,
      username: comment.user.username,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  async deleteComment(userId: number, commentId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('评论不存在');
    if (comment.userId !== userId) throw new ForbiddenException('只能删除自己的评论');

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { ok: true };
  }
}
