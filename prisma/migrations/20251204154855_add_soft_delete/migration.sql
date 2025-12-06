-- AlterTable
ALTER TABLE "AdminMentor" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AppliedJob" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AdminMentor_deletedAt_idx" ON "AdminMentor"("deletedAt");

-- CreateIndex
CREATE INDEX "ApiKey_deletedAt_idx" ON "ApiKey"("deletedAt");

-- CreateIndex
CREATE INDEX "AppliedJob_deletedAt_idx" ON "AppliedJob"("deletedAt");

-- CreateIndex
CREATE INDEX "Progress_deletedAt_idx" ON "Progress"("deletedAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
