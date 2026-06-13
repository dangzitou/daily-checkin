import { describe, expect, it } from 'vitest';
import { shouldSendReminder } from './reminder-policy';

describe('shouldSendReminder', () => {
  it('sends only when the task is active, due now, incomplete, and not sent today', () => {
    expect(
      shouldSendReminder({
        active: true,
        reminderTime: '21:30',
        nowTime: '21:30',
        completedToday: false,
        alreadySentToday: false
      })
    ).toBe(true);
  });

  it('does not send for completed, inactive, missing, mismatched, or already-sent reminders', () => {
    const base = {
      active: true,
      reminderTime: '21:30',
      nowTime: '21:30',
      completedToday: false,
      alreadySentToday: false
    };

    expect(shouldSendReminder({ ...base, completedToday: true })).toBe(false);
    expect(shouldSendReminder({ ...base, active: false })).toBe(false);
    expect(shouldSendReminder({ ...base, reminderTime: null })).toBe(false);
    expect(shouldSendReminder({ ...base, nowTime: '21:31' })).toBe(false);
    expect(shouldSendReminder({ ...base, alreadySentToday: true })).toBe(false);
  });
});
