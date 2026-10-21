-- CreateTable
CREATE TABLE `SaleListing` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `salePrice` VARCHAR(191) NOT NULL DEFAULT '',
    `note` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SaleListing_userId_idx`(`userId`),
    INDEX `SaleListing_itemId_idx`(`itemId`),
    UNIQUE INDEX `SaleListing_userId_itemId_key`(`userId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SaleListing` ADD CONSTRAINT `SaleListing_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleListing` ADD CONSTRAINT `SaleListing_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
