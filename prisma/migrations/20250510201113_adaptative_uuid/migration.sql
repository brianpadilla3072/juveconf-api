/*
  Warnings:

  - The primary key for the `Combo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ComboToOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_ComboToOrder" DROP CONSTRAINT "_ComboToOrder_A_fkey";

-- AlterTable
ALTER TABLE "Combo" DROP CONSTRAINT "Combo_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Combo_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Combo_id_seq";

-- AlterTable
ALTER TABLE "_ComboToOrder" DROP CONSTRAINT "_ComboToOrder_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_ComboToOrder_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "_ComboToOrder" ADD CONSTRAINT "_ComboToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
