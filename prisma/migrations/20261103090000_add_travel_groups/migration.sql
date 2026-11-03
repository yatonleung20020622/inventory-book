-- CreateTable
CREATE TABLE `travel_groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `travel_groups_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `travel_places` ADD COLUMN `groupId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `travel_places_groupId_idx` ON `travel_places`(`groupId`);

-- AddForeignKey
ALTER TABLE `travel_places` ADD CONSTRAINT `travel_places_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `travel_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;