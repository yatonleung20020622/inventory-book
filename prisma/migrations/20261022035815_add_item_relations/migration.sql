-- CreateTable
CREATE TABLE `ItemRelation` (
    `id` VARCHAR(191) NOT NULL,
    `fromItemId` VARCHAR(191) NOT NULL,
    `toItemId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ItemRelation_fromItemId_idx`(`fromItemId`),
    INDEX `ItemRelation_toItemId_idx`(`toItemId`),
    INDEX `ItemRelation_userId_idx`(`userId`),
    UNIQUE INDEX `ItemRelation_fromItemId_toItemId_type_key`(`fromItemId`, `toItemId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemRelation` ADD CONSTRAINT `ItemRelation_fromItemId_fkey` FOREIGN KEY (`fromItemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemRelation` ADD CONSTRAINT `ItemRelation_toItemId_fkey` FOREIGN KEY (`toItemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemRelation` ADD CONSTRAINT `ItemRelation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
