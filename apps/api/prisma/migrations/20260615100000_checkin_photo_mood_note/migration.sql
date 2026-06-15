-- AlterTable
ALTER TABLE `checkins` ADD COLUMN `photo_url` VARCHAR(500) NULL,
    ADD COLUMN `mood` VARCHAR(10) NULL,
    ADD COLUMN `note` VARCHAR(500) NULL;
