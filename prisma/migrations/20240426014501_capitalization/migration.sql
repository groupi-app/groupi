/*
  Warnings:

  - You are about to drop the column `datetime` on the `PotentialDateTime` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PotentialDateTime" DROP COLUMN "datetime",
ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
