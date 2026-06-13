import { Inject, Injectable } from '@nestjs/common';
import { todayInShanghai } from '../../domain/dates';
import { calculateStreaks } from '../../domain/streaks';
import { CheckinsService } from '../checkins/checkins.service';

@Injectable()
export class StatsService {
  constructor(@Inject(CheckinsService) private readonly checkins: CheckinsService) {}

  async summary(userId: number) {
    const today = todayInShanghai();
    const completedDates = await this.checkins.completedDates(userId, today);
    const streaks = calculateStreaks({ today, completedDates });
    return {
      today,
      currentStreak: streaks.current,
      bestStreak: streaks.best
    };
  }
}
