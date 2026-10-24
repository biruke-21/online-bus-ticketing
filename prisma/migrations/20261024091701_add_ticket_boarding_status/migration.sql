-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "boarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "boardedAt" TIMESTAMP(3);
