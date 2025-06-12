-- CreateEnum
CREATE TYPE "NotificationMethodType" AS ENUM ('EMAIL', 'PUSH', 'WEBHOOK');

-- CreateTable
CREATE TABLE "PersonSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "PersonSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationMethod" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settingsId" TEXT NOT NULL,
    "type" "NotificationMethodType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "value" TEXT NOT NULL,

    CONSTRAINT "NotificationMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "methodId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonSettings_personId_key" ON "PersonSettings"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_notificationType_methodId_key" ON "NotificationSetting"("notificationType", "methodId");

-- AddForeignKey
ALTER TABLE "PersonSettings" ADD CONSTRAINT "PersonSettings_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationMethod" ADD CONSTRAINT "NotificationMethod_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "PersonSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "NotificationMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
