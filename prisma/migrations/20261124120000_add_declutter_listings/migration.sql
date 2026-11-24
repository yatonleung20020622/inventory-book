-- CreateTable
CREATE TABLE `declutter_listings` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `condition` VARCHAR(191) NOT NULL DEFAULT '',
    `price` VARCHAR(191) NOT NULL DEFAULT '',
    `locationNote` VARCHAR(191) NOT NULL DEFAULT '',
    `contactNote` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('AVAILABLE', 'RESERVED', 'GONE', 'HIDDEN') NOT NULL DEFAULT 'AVAILABLE',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `declutter_listings_categoryId_idx`(`categoryId`),
    INDEX `declutter_listings_status_idx`(`status`),
    INDEX `declutter_listings_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `declutter_listings` ADD CONSTRAINT `declutter_listings_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
