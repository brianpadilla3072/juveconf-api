# Migración del Sistema de Asistencia

## Resumen
Este documento describe la migración del sistema de asistencia de un modelo estático (2 días fijos) a un modelo dinámico que soporta N días.

## Fecha de Migración
**23 de Octubre de 2025**

---

## Cambios Realizados

### 1. **Base de Datos - Esquema**

#### Antes (Sistema Estático)
```sql
CREATE TABLE "Invitee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuil" TEXT NOT NULL,
    "attendedDay1" BOOLEAN NOT NULL DEFAULT false,
    "attendedDay2" BOOLEAN NOT NULL DEFAULT false,
    ...
)
```

#### Después (Sistema Dinámico)
```sql
CREATE TABLE "Invitee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuil" TEXT NOT NULL,
    "attendance" JSONB,  -- Sistema dinámico
    ...
)
```

### 2. **Estructura del JSON de Asistencia**

```json
{
  "days": {
    "1": {
      "attended": true,
      "timestamp": "2025-10-23T18:30:00Z",
      "notes": "Llegó temprano"
    },
    "2": {
      "attended": false
    },
    "3": {
      "attended": true,
      "timestamp": "2025-10-24T19:00:00Z"
    }
  }
}
```

### 3. **Modelo de Eventos - eventDays**

Se agregó soporte para generar automáticamente los días del evento:

```json
{
  "days": [
    {
      "date": "2025-11-01",
      "dayNumber": 1,
      "label": "Día 1",
      "type": "general"
    },
    {
      "date": "2025-11-02",
      "dayNumber": 2,
      "label": "Día 2",
      "type": "general"
    }
  ],
  "totalDays": 2
}
```

---

## Proceso de Migración de Datos

### Script de Migración
**Ubicación**: `src/invitees/scripts/migrate-attendance.ts.bak`

### ¿Qué hace el script?
1. Lee todos los invitados con `attendedDay1` o `attendedDay2` en `true`
2. Convierte los datos al nuevo formato JSON
3. Actualiza el campo `attendance`
4. NO elimina las columnas antiguas (se hace con migración separada)

### Estado de Ejecución
- ✅ **EJECUTADO**: 23 de Octubre de 2025
- ✅ **Registros migrados**: 0 (base de datos vacía en desarrollo)
- ✅ **Errores**: Ninguno

---

## Migraciones de Base de Datos

### Migración 1: Eliminar Columnas Obsoletas
**Archivo**: `prisma/migrations/20251023_remove_old_attendance_columns/migration.sql`

```sql
-- RemoveOldAttendanceColumns
ALTER TABLE "Invitee" DROP COLUMN IF EXISTS "attendedDay1";
ALTER TABLE "Invitee" DROP COLUMN IF EXISTS "attendedDay2";
```

**Estado**: ⏳ Pendiente de ejecutar cuando la base de datos esté disponible

### Migración 2: Agregar CANCELLED a OrderStatus
**Archivo**: `prisma/migrations/20251023_add_cancelled_status/migration.sql`

```sql
-- AddCancelledStatus
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
```

**Estado**: ⏳ Pendiente de ejecutar

---

## Validación Zod

### AttendanceSchema
**Ubicación**: `src/invitees/schemas/attendance.schema.ts`

```typescript
export const AttendanceRecordSchema = z.object({
  attended: z.boolean(),
  timestamp: z.string().datetime().optional(),
  notes: z.string().optional()
});

export const AttendanceSchema = z.object({
  days: z.record(
    z.string().regex(/^\d+$/, 'Day key must be a numeric string'),
    AttendanceRecordSchema
  )
});
```

### EventDaysSchema
**Ubicación**: `src/events/schemas/event-days.schema.ts`

```typescript
export const EventDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dayNumber: z.number().int().positive(),
  label: z.string().optional(),
  type: z.string().optional()
});

export const EventDaysSchema = z.object({
  days: z.array(EventDaySchema).min(1, 'Event must have at least one day'),
  totalDays: z.number().int().positive()
});
```

---

## Endpoints Actualizados

### Nuevo Endpoint
```
PATCH /invitees/:id/attendance/day
Body: { dayNumber: number, attended: boolean, notes?: string }
```

### Endpoints Deprecados
```
❌ PATCH /invitees/:id/attendance (ELIMINADO)
```

---

## Frontend - Cambios

### 1. Entities
- ✅ `Invitee.ts` - Estructura `Attendance` con `notes`
- ✅ `Event.ts` - `EventDays` con días dinámicos

### 2. Hooks
- ✅ `useQRAttendance.ts` - Usa nuevo endpoint
- ✅ `useMutateInvitee.ts` - Hook antiguo deprecado

### 3. Componentes
- ✅ `AttendanceModal.tsx` - Radio buttons dinámicos
- ✅ `invitados/page.tsx` - Tabla con columnas dinámicas

### 4. PDF Generation
- ✅ `useInviteesPDF.ts` - Genera columnas según días del evento

---

## Cómo Ejecutar las Migraciones Pendientes

Cuando la base de datos esté disponible:

```bash
cd juveconf-api

# 1. Ejecutar migraciones pendientes
npx prisma migrate deploy

# 2. Regenerar el cliente de Prisma
npx prisma generate

# 3. Verificar que las columnas fueron eliminadas
npx prisma db pull --print | grep -A 10 "model Invitee"
```

---

## Rollback (Solo si es necesario)

Si necesitas revertir la migración:

```sql
-- 1. Restaurar columnas antiguas
ALTER TABLE "Invitee" ADD COLUMN "attendedDay1" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invitee" ADD COLUMN "attendedDay2" BOOLEAN NOT NULL DEFAULT false;

-- 2. Copiar datos desde JSON
UPDATE "Invitee"
SET
  "attendedDay1" = (attendance->'days'->'1'->>'attended')::boolean,
  "attendedDay2" = (attendance->'days'->'2'->>'attended')::boolean
WHERE attendance IS NOT NULL;

-- 3. Eliminar columna JSON
ALTER TABLE "Invitee" DROP COLUMN "attendance";
```

---

## Verificación Post-Migración

### Checklist
- [ ] Las columnas `attendedDay1` y `attendedDay2` no existen en la DB
- [ ] El campo `attendance` contiene datos en formato JSON
- [ ] El campo `eventDays` se genera automáticamente al crear eventos
- [ ] Los endpoints nuevos funcionan correctamente
- [ ] El frontend muestra columnas dinámicas en la tabla
- [ ] El PDF genera columnas según el número de días
- [ ] El dashboard muestra stats dinámicas

### Consultas de Verificación

```sql
-- 1. Verificar estructura de Invitee
\d "Invitee"

-- 2. Ver ejemplos de attendance JSON
SELECT id, name, attendance
FROM "Invitee"
WHERE attendance IS NOT NULL
LIMIT 5;

-- 3. Ver ejemplos de eventDays JSON
SELECT id, topic, "eventDays"
FROM "Event"
WHERE "eventDays" IS NOT NULL
LIMIT 5;
```

---

## Soporte

Para preguntas o problemas relacionados con esta migración:
- **Documentación Técnica**: Este archivo
- **Script de Migración**: `src/invitees/scripts/migrate-attendance.ts.bak`
- **Schemas Zod**: `src/invitees/schemas/` y `src/events/schemas/`

---

## Historial de Cambios

| Fecha | Acción | Estado |
|-------|--------|--------|
| 2025-10-23 | Creación de script de migración | ✅ Completado |
| 2025-10-23 | Ejecución de script (0 registros) | ✅ Completado |
| 2025-10-23 | Actualización de schema.prisma | ✅ Completado |
| 2025-10-23 | Creación de migración SQL | ✅ Completado |
| Pendiente | Ejecución de migración en DB | ⏳ Pendiente |
| Pendiente | Verificación en producción | ⏳ Pendiente |
