-- CreateEnum
CREATE TYPE "ScanlatorMemberRole" AS ENUM ('OWNER', 'EDITOR');

-- DropForeignKey
ALTER TABLE "ChapterPage" DROP CONSTRAINT "ChapterPage_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterText" DROP CONSTRAINT "ChapterText_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_workId_fkey";

-- DropForeignKey
ALTER TABLE "ReadingProgress" DROP CONSTRAINT "ReadingProgress_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "ReadingProgress" DROP CONSTRAINT "ReadingProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReadingProgress" DROP CONSTRAINT "ReadingProgress_workId_fkey";

-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "scanlatorId" TEXT,
ADD COLUMN     "uploadedById" TEXT;

-- CreateTable
CREATE TABLE "Scanlator" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scanlator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanlatorMember" (
    "id" TEXT NOT NULL,
    "scanlatorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ScanlatorMemberRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanlatorMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkScanlator" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "scanlatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkScanlator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scanlator_slug_key" ON "Scanlator"("slug");

-- CreateIndex
CREATE INDEX "Scanlator_name_idx" ON "Scanlator"("name");

-- CreateIndex
CREATE INDEX "ScanlatorMember_scanlatorId_idx" ON "ScanlatorMember"("scanlatorId");

-- CreateIndex
CREATE INDEX "ScanlatorMember_userId_idx" ON "ScanlatorMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanlatorMember_scanlatorId_userId_key" ON "ScanlatorMember"("scanlatorId", "userId");

-- CreateIndex
CREATE INDEX "WorkScanlator_workId_idx" ON "WorkScanlator"("workId");

-- CreateIndex
CREATE INDEX "WorkScanlator_scanlatorId_idx" ON "WorkScanlator"("scanlatorId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkScanlator_workId_scanlatorId_key" ON "WorkScanlator"("workId", "scanlatorId");

-- CreateIndex
CREATE INDEX "Chapter_scanlatorId_idx" ON "Chapter"("scanlatorId");

-- CreateIndex
CREATE INDEX "Chapter_uploadedById_idx" ON "Chapter"("uploadedById");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_scanlatorId_fkey" FOREIGN KEY ("scanlatorId") REFERENCES "Scanlator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterPage" ADD CONSTRAINT "ChapterPage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterText" ADD CONSTRAINT "ChapterText_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanlatorMember" ADD CONSTRAINT "ScanlatorMember_scanlatorId_fkey" FOREIGN KEY ("scanlatorId") REFERENCES "Scanlator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanlatorMember" ADD CONSTRAINT "ScanlatorMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkScanlator" ADD CONSTRAINT "WorkScanlator_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkScanlator" ADD CONSTRAINT "WorkScanlator_scanlatorId_fkey" FOREIGN KEY ("scanlatorId") REFERENCES "Scanlator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
