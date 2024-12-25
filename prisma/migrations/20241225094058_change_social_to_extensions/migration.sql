/*
  Warnings:

  - You are about to drop the column `social` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "social",
ADD COLUMN     "extensions" JSONB NOT NULL DEFAULT '{}';
