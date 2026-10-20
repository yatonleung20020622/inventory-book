-- AlterTable
ALTER TABLE `Item` ADD COLUMN `locationId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Item_locationId_idx` ON `Item`(`locationId`);

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
