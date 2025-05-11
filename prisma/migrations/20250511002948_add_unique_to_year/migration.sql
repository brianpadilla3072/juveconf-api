/*
  Warnings:

  - A unique constraint covering the columns `[year]` on the table `Combo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Combo_year_key" ON "Combo"("year");
