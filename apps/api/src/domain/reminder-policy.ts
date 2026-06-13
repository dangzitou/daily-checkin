export interface ReminderPolicyInput {
  active: boolean;
  reminderTime: string | null;
  nowTime: string;
  completedToday: boolean;
  alreadySentToday: boolean;
}

export function shouldSendReminder(input: ReminderPolicyInput): boolean {
  return (
    input.active &&
    input.reminderTime !== null &&
    input.reminderTime === input.nowTime &&
    !input.completedToday &&
    !input.alreadySentToday
  );
}
