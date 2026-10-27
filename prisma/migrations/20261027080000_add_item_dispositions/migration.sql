-- CreateTable
CREATE TABLE `item_dispositions` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `working_condition` VARCHAR(191) NOT NULL DEFAULT '',
    `disposal_status` VARCHAR(191) NOT NULL DEFAULT '',
    `disposal_method` VARCHAR(191) NOT NULL DEFAULT '',
    `disposed_at` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `item_dispositions_itemId_key`(`itemId`),
    INDEX `item_dispositions_userId_idx`(`userId`),
    INDEX `item_dispositions_disposal_status_idx`(`disposal_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `item_dispositions` ADD CONSTRAINT `item_dispositions_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_dispositions` ADD CONSTRAINT `item_dispositions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
