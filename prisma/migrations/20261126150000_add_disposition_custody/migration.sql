-- AlterTable
ALTER TABLE `item_dispositions` ADD COLUMN `lent_to` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `due_date` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `custody_notes` TEXT NOT NULL;
