/*
  Warnings:

  - Made the column `minPersons` on table `Combo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Combo" ALTER COLUMN "minPersons" SET NOT NULL;
