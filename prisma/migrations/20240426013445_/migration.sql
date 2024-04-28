/*
  Warnings:

  - You are about to drop the column `time` on the `PotentialDateTime` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PotentialDateTime" DROP COLUMN "time",
ADD COLUMN     "datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
