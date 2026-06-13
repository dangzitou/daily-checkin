import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  get configured(): boolean {
    return Boolean(this.config.get<string>('SMTP_HOST') && this.config.get<string>('SMTP_FROM'));
  }

  async sendTaskReminder(input: { to: string; username: string; taskTitle: string }) {
    if (!this.configured) {
      this.logger.warn('SMTP is not configured; reminder email skipped.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASS')
          }
        : undefined
    });

    await transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to: input.to,
      subject: `打卡提醒：${input.taskTitle}`,
      text: `${input.username}，今天的「${input.taskTitle}」还没有打卡。`
    });
  }
}
