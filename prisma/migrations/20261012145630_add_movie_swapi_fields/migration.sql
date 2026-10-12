/*
  Warnings:

  - A unique constraint covering the columns `[sourceUrl]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "characters" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "planets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sourceCreatedAt" TIMESTAMP(3),
ADD COLUMN     "sourceEditedAt" TIMESTAMP(3),
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "species" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "starships" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "vehicles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "releaseDate" SET DATA TYPE DATE;

-- CreateIndex
CREATE UNIQUE INDEX "Movie_sourceUrl_key" ON "Movie"("sourceUrl");
