-- AlterTable
ALTER TABLE "AdminMentor" ADD COLUMN     "verifiedByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verifiedByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "AdminMentor_verifiedByAdmin_idx" ON "AdminMentor"("verifiedByAdmin");

-- CreateIndex
CREATE INDEX "User_verifiedByAdmin_idx" ON "User"("verifiedByAdmin");
