-- CreateTable
CREATE TABLE `ApiKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hashedKey` VARCHAR(191) NOT NULL,
    `roles` JSON NOT NULL,
    `owner` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ApiKey_hashedKey_key`(`hashedKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
