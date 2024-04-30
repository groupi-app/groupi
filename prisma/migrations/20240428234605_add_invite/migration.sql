-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'PENDING';

-- AlterTable
-- ALTER TABLE "Membership" ALTER COLUMN "role" SET DEFAULT 'ATTENDEE',
-- ALTER COLUMN "rsvpStatus" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "usesRemaining" INTEGER,
    "maxUses" INTEGER,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
