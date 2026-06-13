import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { timeInShanghai, todayInShanghai } from '../../domain/dates';
import { shouldSendReminder } from '../../domain/reminder-policy';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailerService } from './mailer.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(RedisService)
    private readonly redis: RedisService,
    @Inject(MailerService)
    private readonly mailer: MailerService
  ) {}

  @Cron('* * * * *')
  async sendDueReminders() {
    const today = todayInShanghai();
    const nowTime = timeInShanghai();
    const tasks = await this.prisma.task.findMany({
      where: { isActive: true, reminderTime: nowTime },
      include: {
        user: { select: { id: true, username: true, email: true } },
        checkins: { where: { checkinDate: today }, select: { id: true } }
      }
    });

    for (const task of tasks) {
      const key = `reminder:${today}:${task.id}`;
      const alreadySentToday = Boolean(await this.redis.get(key));
      const send = shouldSendReminder({
        active: task.isActive,
        reminderTime: task.reminderTime,
        nowTime,
        completedToday: task.checkins.length > 0,
        alreadySentToday
      });

      if (!send) {
        continue;
      }

      if (!task.user.email) {
        continue;
      }

      try {
        await this.mailer.sendTaskReminder({
          to: task.user.email,
          username: task.user.username,
          taskTitle: task.title
        });
        await this.redis.setex(key, 172800, '1');
      } catch (error) {
        this.logger.error(`Failed to send reminder for task ${task.id}`, error as Error);
      }
    }
  }
}
