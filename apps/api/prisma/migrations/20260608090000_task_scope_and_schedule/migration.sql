ALTER TABLE `tasks`
  ADD COLUMN `scope` VARCHAR(16) NOT NULL DEFAULT 'resident',
  ADD COLUMN `scheduled_date` VARCHAR(10) NULL;

CREATE INDEX `tasks_user_id_scope_scheduled_date_idx`
  ON `tasks`(`user_id`, `scope`, `scheduled_date`);
