/*
  Warnings:

  - A unique constraint covering the columns `[name,year]` on the table `Combo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `Combo` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Combo_year_key";

-- AlterTable
ALTER TABLE "Combo" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Combo_name_year_key" ON "Combo"("name", "year");

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
