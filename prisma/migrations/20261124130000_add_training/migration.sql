-- CreateTable
CREATE TABLE `train_exercises` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `defaultRestSec` INTEGER NOT NULL DEFAULT 60,
    `notes` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `train_exercises_name_key`(`name`),
    INDEX `train_exercises_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `train_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `startedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `train_sessions_startedAt_idx`(`startedAt`),
    INDEX `train_sessions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `train_session_exercises` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `targetRestSec` INTEGER NOT NULL DEFAULT 60,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `train_session_exercises_sessionId_idx`(`sessionId`),
    INDEX `train_session_exercises_exerciseId_idx`(`exerciseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `train_sets` (
    `id` VARCHAR(191) NOT NULL,
    `sessionExerciseId` VARCHAR(191) NOT NULL,
    `setIndex` INTEGER NOT NULL,
    `reps` INTEGER NOT NULL DEFAULT 0,
    `durationSec` INTEGER NOT NULL DEFAULT 0,
    `restAfterSec` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `train_sets_sessionExerciseId_idx`(`sessionExerciseId`),
    UNIQUE INDEX `train_sets_sessionExerciseId_setIndex_key`(`sessionExerciseId`, `setIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `train_session_exercises` ADD CONSTRAINT `train_session_exercises_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `train_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `train_session_exercises` ADD CONSTRAINT `train_session_exercises_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `train_exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `train_sets` ADD CONSTRAINT `train_sets_sessionExerciseId_fkey` FOREIGN KEY (`sessionExerciseId`) REFERENCES `train_session_exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
