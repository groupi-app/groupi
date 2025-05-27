-- CreateEnum
CREATE TYPE "WebhookFormat" AS ENUM ('DISCORD', 'SLACK', 'TEAMS', 'GENERIC', 'CUSTOM');

-- AlterTable
ALTER TABLE "NotificationMethod" ADD COLUMN     "customTemplate" TEXT,
ADD COLUMN     "webhookFormat" "WebhookFormat",
ADD COLUMN     "webhookHeaders" JSONB;
