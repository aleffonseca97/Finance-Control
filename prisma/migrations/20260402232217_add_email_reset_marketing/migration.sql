-- AlterTable
ALTER TABLE "User" ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT;
