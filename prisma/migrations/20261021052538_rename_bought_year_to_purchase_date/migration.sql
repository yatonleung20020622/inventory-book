/*
  Warnings:

  - You are about to drop the column `boughtYear` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Item` DROP COLUMN `boughtYear`,
    ADD COLUMN `purchaseDate` VARCHAR(191) NOT NULL DEFAULT '';
