/*
  Warnings:

  - You are about to drop the column `dni` on the `Invitee` table. All the data in the column will be lost.
  - Added the required column `cuil` to the `Invitee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitee" DROP COLUMN "dni",
ADD COLUMN     "cuil" TEXT NOT NULL;
