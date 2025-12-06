-- CreateTable
CREATE TABLE IF NOT EXISTS "AppliedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "url" TEXT NOT NULL,
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Applied',
    "type" TEXT NOT NULL DEFAULT 'Website',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppliedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdminMentor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "expertise" TEXT,
    "background" TEXT,
    "availability" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminMentor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AppliedJob_status_idx" ON "AppliedJob"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AppliedJob_type_idx" ON "AppliedJob"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AppliedJob_userId_idx" ON "AppliedJob"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Progress_userId_idx" ON "Progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Progress_userId_key" ON "Progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AdminMentor_email_key" ON "AdminMentor"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminMentor_email_idx" ON "AdminMentor"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminMentor_isAdmin_idx" ON "AdminMentor"("isAdmin");

-- AlterTable (only add mentorId if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='mentorId') THEN
        ALTER TABLE "User" ADD COLUMN "mentorId" TEXT;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_mentorId_idx" ON "User"("mentorId");

-- AddForeignKey (only if constraint doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='AppliedJob_userId_fkey') THEN
        ALTER TABLE "AppliedJob" ADD CONSTRAINT "AppliedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='Progress_userId_fkey') THEN
        ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='User_mentorId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "AdminMentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

