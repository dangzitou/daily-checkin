import { IsIn } from 'class-validator';

const REDEMPTION_STATUSES = ['pending', 'approved', 'delivered', 'rejected'] as const;

export class UpdateStatusDto {
  @IsIn(REDEMPTION_STATUSES, { message: '状态值无效，必须为 pending/approved/delivered/rejected' })
  status!: string;
}
