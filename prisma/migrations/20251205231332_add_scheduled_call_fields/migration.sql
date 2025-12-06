-- AlterTable
ALTER TABLE "UserStatus" ADD COLUMN     "fifthMentorCallGoogleMeetLink" TEXT,
ADD COLUMN     "fifthMentorCallScheduledAt" TIMESTAMP(3),
ADD COLUMN     "finalReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstMentorCallGoogleMeetLink" TEXT,
ADD COLUMN     "firstMentorCallScheduledAt" TIMESTAMP(3),
ADD COLUMN     "fourthMentorCallGoogleMeetLink" TEXT,
ADD COLUMN     "fourthMentorCallScheduledAt" TIMESTAMP(3),
ADD COLUMN     "secondMentorCallGoogleMeetLink" TEXT,
ADD COLUMN     "secondMentorCallScheduledAt" TIMESTAMP(3),
ADD COLUMN     "thirdMentorCallGoogleMeetLink" TEXT,
ADD COLUMN     "thirdMentorCallScheduledAt" TIMESTAMP(3);
