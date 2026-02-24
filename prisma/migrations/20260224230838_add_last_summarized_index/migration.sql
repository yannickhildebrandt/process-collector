-- DropForeignKey
ALTER TABLE "InterviewSession" DROP CONSTRAINT "InterviewSession_employeeId_fkey";

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "lastSummarizedIndex" INTEGER NOT NULL DEFAULT -1;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
