-- Las comidas se activan por combo (Combo.mealsEnabled); el evento solo guarda la configuracion (Event.mealConfig).
-- Idempotente. Orden de aplicacion en produccion:
--   1) el ADD COLUMN (compatible con la imagen anterior)
--   2) desplegar la imagen nueva
--   3) recien despues el DROP COLUMN (la imagen anterior todavia lee Event.mealsEnabled)

ALTER TABLE "Combo" ADD COLUMN IF NOT EXISTS "mealsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Paso 3 (despues del deploy):
-- ALTER TABLE "Event" DROP COLUMN IF EXISTS "mealsEnabled";
