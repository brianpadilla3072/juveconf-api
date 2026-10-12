-- Comidas (JueConfe 2026). Idempotente: se aplica con psql, sin transaccion global
-- (ALTER TYPE ... ADD VALUE no se puede usar dentro de la misma transaccion en que se agrega).

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'BUFFET';

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "mealsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "mealConfig" JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registrationSeq" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Invitee" ADD COLUMN IF NOT EXISTS "registrationCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Invitee_registrationCode_key" ON "Invitee"("registrationCode");

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "proofSent" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "MealSelection" (
  "id" TEXT NOT NULL,
  "inviteeId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "slotCode" TEXT NOT NULL,
  "optionNumber" INTEGER NOT NULL,
  "optionName" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "deliveredAt" TIMESTAMP(3),
  "deliveredById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MealSelection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MealSelection_inviteeId_slotCode_key" ON "MealSelection"("inviteeId", "slotCode");
CREATE INDEX IF NOT EXISTS "MealSelection_orderId_idx" ON "MealSelection"("orderId");
CREATE INDEX IF NOT EXISTS "MealSelection_slotCode_optionNumber_idx" ON "MealSelection"("slotCode", "optionNumber");
CREATE INDEX IF NOT EXISTS "MealSelection_slotCode_deliveredAt_idx" ON "MealSelection"("slotCode", "deliveredAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MealSelection_inviteeId_fkey') THEN
    ALTER TABLE "MealSelection"
      ADD CONSTRAINT "MealSelection_inviteeId_fkey"
      FOREIGN KEY ("inviteeId") REFERENCES "Invitee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
