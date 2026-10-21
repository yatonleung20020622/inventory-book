/*
  Warnings:

  - You are about to drop the `SubItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `SubItem` DROP FOREIGN KEY `SubItem_itemId_fkey`;

-- DropTable
DROP TABLE `SubItem`;
