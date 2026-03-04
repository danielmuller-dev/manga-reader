-- CreateEnum
CREATE TYPE "ChapterKind" AS ENUM ('IMAGES', 'TEXT');

-- CreateEnum
CREATE TYPE "ReadMode" AS ENUM ('SCROLL', 'PAGINATED');

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "number" DOUBLE PRECISION,
    "title" TEXT,
    "kind" "ChapterKind" NOT NULL,
    "readMode" "ReadMode",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterPage" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "ChapterPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterText" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "ChapterText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chapter_workId_idx" ON "Chapter"("workId");

-- CreateIndex
CREATE INDEX "ChapterPage_chapterId_idx" ON "ChapterPage"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterPage_chapterId_index_key" ON "ChapterPage"("chapterId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterText_chapterId_key" ON "ChapterText"("chapterId");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterPage" ADD CONSTRAINT "ChapterPage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterText" ADD CONSTRAINT "ChapterText_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
