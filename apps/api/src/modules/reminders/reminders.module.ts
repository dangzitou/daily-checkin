import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { RemindersService } from './reminders.service';

@Module({
  providers: [MailerService, RemindersService]
})
export class RemindersModule {}
