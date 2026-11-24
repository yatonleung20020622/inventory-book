-- CreateTable
CREATE TABLE `travel_plans` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `startDate` VARCHAR(191) NOT NULL DEFAULT '',
    `endDate` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `travel_plans_startDate_idx`(`startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `travel_plan_items` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `notes` TEXT NOT NULL,
    `url` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('IDEA', 'RESEARCHING', 'BOOKED', 'SKIPPED') NOT NULL DEFAULT 'IDEA',
    `startDate` VARCHAR(191) NOT NULL DEFAULT '',
    `endDate` VARCHAR(191) NOT NULL DEFAULT '',
    `cost` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `travel_plan_items_planId_idx`(`planId`),
    INDEX `travel_plan_items_status_idx`(`status`),
    INDEX `travel_plan_items_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `travel_plan_items` ADD CONSTRAINT `travel_plan_items_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `travel_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
