CREATE TABLE `goals` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `task_id` INTEGER NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) NULL,
  `start_date` VARCHAR(10) NOT NULL,
  `target_date` VARCHAR(10) NOT NULL,
  `target_count` INTEGER NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `goals_user_id_is_active_idx`(`user_id`, `is_active`),
  INDEX `goals_task_id_idx`(`task_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `goals`
  ADD CONSTRAINT `goals_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `goals`
  ADD CONSTRAINT `goals_task_id_fkey`
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
