-- Script para corregir nombres de templates en EmailQueue
-- Este script actualiza registros con nombres de template incorrectos
-- Ejecutar este script en la base de datos PostgreSQL

-- ============================================
-- 1. VERIFICAR REGISTROS PROBLEMÁTICOS
-- ============================================

-- Ver cuántos registros tienen template names incorrectos
SELECT
  template,
  "emailType",
  status,
  COUNT(*) as count
FROM "EmailQueue"
WHERE template IN ('TICKET_DOWNLOAD', 'PASSWORD_RESET', 'ORDEN_TRANSFER', 'ORDEN_CASH')
GROUP BY template, "emailType", status
ORDER BY count DESC;

-- Ver los últimos 10 registros problemáticos con detalles
SELECT
  id,
  template,
  "emailType",
  status,
  attempts,
  "errorMessage",
  "createdAt",
  "lastAttemptAt"
FROM "EmailQueue"
WHERE template IN ('TICKET_DOWNLOAD', 'PASSWORD_RESET', 'ORDEN_TRANSFER', 'ORDEN_CASH')
ORDER BY "createdAt" DESC
LIMIT 10;

-- ============================================
-- 2. ACTUALIZAR REGISTROS
-- ============================================

-- Actualizar TICKET_DOWNLOAD a ticket-details
UPDATE "EmailQueue"
SET
  template = 'ticket-details',
  "updatedAt" = NOW()
WHERE template = 'TICKET_DOWNLOAD';

-- Actualizar PASSWORD_RESET a reset-password
UPDATE "EmailQueue"
SET
  template = 'reset-password',
  "updatedAt" = NOW()
WHERE template = 'PASSWORD_RESET';

-- Actualizar ORDEN_TRANSFER a order-pending
UPDATE "EmailQueue"
SET
  template = 'order-pending',
  "updatedAt" = NOW()
WHERE template = 'ORDEN_TRANSFER';

-- Actualizar ORDEN_CASH a order-pending
UPDATE "EmailQueue"
SET
  template = 'order-pending',
  "updatedAt" = NOW()
WHERE template = 'ORDEN_CASH';

-- ============================================
-- 3. VERIFICAR RESULTADOS
-- ============================================

-- Verificar que ya no hay registros con nombres incorrectos
SELECT COUNT(*) as remaining_issues
FROM "EmailQueue"
WHERE template IN ('TICKET_DOWNLOAD', 'PASSWORD_RESET', 'ORDEN_TRANSFER', 'ORDEN_CASH');

-- Ver distribución actualizada de templates
SELECT
  template,
  status,
  COUNT(*) as count
FROM "EmailQueue"
GROUP BY template, status
ORDER BY template, status;

-- ============================================
-- 4. OPCIONAL: REINTENTAR EMAILS FALLIDOS
-- ============================================

-- Si quieres reintentar los emails que fallaron por template incorrecto:
-- PRECAUCIÓN: Esto marcará emails fallidos como pendientes para reintento

-- Primero, revisar cuántos emails fallidos hay por template incorrecto:
SELECT COUNT(*) as failed_count
FROM "EmailQueue"
WHERE status = 'FAILED'
  AND "errorMessage" LIKE '%ENOENT%TICKET_DOWNLOAD%';

-- Para reintentar (DESCOMENTAR si estás seguro):
/*
UPDATE "EmailQueue"
SET
  status = 'PENDING',
  attempts = 0,
  "errorMessage" = NULL,
  "lastAttemptAt" = NULL,
  "updatedAt" = NOW()
WHERE status = 'FAILED'
  AND "errorMessage" LIKE '%ENOENT%TICKET_DOWNLOAD%';
*/

-- ============================================
-- 5. LIMPIEZA (OPCIONAL)
-- ============================================

-- Ver emails muy antiguos que fallaron y nunca se reenviaron (más de 30 días)
SELECT
  id,
  to,
  template,
  "emailType",
  "createdAt",
  attempts,
  "errorMessage"
FROM "EmailQueue"
WHERE status = 'FAILED'
  AND "createdAt" < NOW() - INTERVAL '30 days'
ORDER BY "createdAt" DESC;

-- Para eliminar emails fallidos muy antiguos (DESCOMENTAR si estás seguro):
/*
DELETE FROM "EmailQueue"
WHERE status = 'FAILED'
  AND "createdAt" < NOW() - INTERVAL '30 days';
*/
