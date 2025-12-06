-- AlterTable
ALTER TABLE "UserStatus" ADD COLUMN     "fifthMentorCallCompletedAt" TIMESTAMP(3),
ADD COLUMN     "firstMentorCallCompletedAt" TIMESTAMP(3),
ADD COLUMN     "secondMentorCallCompletedAt" TIMESTAMP(3),
ADD COLUMN     "thirdMentorCallCompletedAt" TIMESTAMP(3);
