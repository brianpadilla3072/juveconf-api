/*
  Warnings:

  - Added the required column `cuil` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cuil" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL;
