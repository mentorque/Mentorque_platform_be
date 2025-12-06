-- CreateTable
CREATE TABLE "UserStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orientation" BOOLEAN NOT NULL DEFAULT false,
    "resumeRebuilding" BOOLEAN NOT NULL DEFAULT false,
    "eligibleForFirstMentorCall" BOOLEAN NOT NULL DEFAULT false,
    "resumeConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "portfolioBuildingAndConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "eligibleForSecondMentorCall" BOOLEAN NOT NULL DEFAULT false,
    "paymentMade" BOOLEAN NOT NULL DEFAULT false,
    "techDistributionAndExtension" BOOLEAN NOT NULL DEFAULT false,
    "eligibleForThirdMentorCall" BOOLEAN NOT NULL DEFAULT false,
    "cheatSheetBuiltOut" BOOLEAN NOT NULL DEFAULT false,
    "hasAppliedEnoughJobs" BOOLEAN NOT NULL DEFAULT false,
    "eligibleForFourthMentorCall" BOOLEAN NOT NULL DEFAULT false,
    "eligibleForFifthMentorCall" BOOLEAN NOT NULL DEFAULT false,
    "fourthMentorCallCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStatus_userId_key" ON "UserStatus"("userId");

-- CreateIndex
CREATE INDEX "UserStatus_userId_idx" ON "UserStatus"("userId");

-- CreateIndex
CREATE INDEX "UserStatus_deletedAt_idx" ON "UserStatus"("deletedAt");

-- AddForeignKey
ALTER TABLE "UserStatus" ADD CONSTRAINT "UserStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
