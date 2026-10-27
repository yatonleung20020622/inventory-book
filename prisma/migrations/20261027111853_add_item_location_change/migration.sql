-- CreateTable
CREATE TABLE `ItemLocationChange` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fromLocationId` VARCHAR(191) NULL,
    `toLocationId` VARCHAR(191) NULL,
    `fromLocationName` VARCHAR(191) NOT NULL DEFAULT '',
    `toLocationName` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemLocationChange_itemId_idx`(`itemId`),
    INDEX `ItemLocationChange_userId_idx`(`userId`),
    INDEX `ItemLocationChange_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemLocationChange` ADD CONSTRAINT `ItemLocationChange_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemLocationChange` ADD CONSTRAINT `ItemLocationChange_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
