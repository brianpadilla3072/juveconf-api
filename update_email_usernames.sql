-- Script para actualizar los userName en el context JSON con nombres reales
-- PRODUCCIÓN - Ejecutar con cuidado
-- Generado: 2025-10-29

-- 1. Marco Quevedo (marcofquevedo@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Marco Quevedo"'
)::json
WHERE "paymentId" = 'd7fd545c-79e3-4813-94b5-6be5a316ed6c'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 2. Silvia Alejandra avit (avitalejandra96@gmail.com - Pago 1)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Silvia Alejandra avit"'
)::json
WHERE "paymentId" = 'beb9892d-a196-45b3-a3f0-ca0f67a333da'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 3. Patricia Urbina (prmangold@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Patricia Urbina"'
)::json
WHERE "paymentId" = '882b968d-6611-44ef-bb5b-6d636f992827'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 4. Eliseo Samuel Velazquez (avitalejandra96@gmail.com - Pago 2)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Eliseo Samuel Velazquez"'
)::json
WHERE "paymentId" = '99e37fe0-168f-4e11-9dfc-e738083be637'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 5. Virginia Lafalla (virilafalla91@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Virginia Lafalla"'
)::json
WHERE "paymentId" = '82e00412-0b73-46cb-9268-7039004f58de'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 6. Magali Jaque (magalijaquee@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Magali Jaque"'
)::json
WHERE "paymentId" = '8c149ff0-fcd1-486a-b6cd-c2e41490b5c0'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 7. Marianella Jaque (jaquemarianella@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Marianella Jaque"'
)::json
WHERE "paymentId" = '30dffe60-6843-403b-86b8-d66e8bbf23ca'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 8. Ferullo maria cristina (cristinaferullo@gmail.com - Pago 1)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Ferullo maria cristina"'
)::json
WHERE "paymentId" = '1748ff18-7473-4cab-b22a-1647ef52f6b4'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 9. Ferullo maria cristina (cristinaferullo@gmail.com - Pago 2)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Ferullo maria cristina"'
)::json
WHERE "paymentId" = 'a226f3e4-b04e-426f-b071-ce63fedbe339'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 10. Maximiliano Peralta (maxiperalta2015@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Maximiliano Peralta"'
)::json
WHERE "paymentId" = '3040acae-888c-4e41-be65-4a5e62c9165c'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 11. Leonardo Yoel Romero (soficarp09@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Leonardo Yoel Romero"'
)::json
WHERE "paymentId" = '2dbe4081-13c7-488e-b304-d6475ec7d8fb'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- 12. Sebastián Pon (rsebapon@gmail.com)
UPDATE "EmailQueue"
SET context = jsonb_set(
  context::jsonb,
  '{userName}',
  '"Sebastián Pon"'
)::json
WHERE "paymentId" = '65d8b581-16e4-4b06-99f7-ffc740f2cb5c'
  AND "emailType" = 'TICKET_DOWNLOAD';

-- Verificar los cambios
SELECT
  "paymentId",
  "to",
  context->>'userName' as userName
FROM "EmailQueue"
WHERE "emailType" = 'TICKET_DOWNLOAD'
ORDER BY "createdAt";
