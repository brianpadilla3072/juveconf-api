# Dashboard de Payments - Endpoints Creados

## Endpoints Implementados

### 1. **Dashboard Summary** 
**GET** `/payments/dashboard/summary`

Devuelve un resumen completo de todos los pagos con filtros opcionales.

**Query Parameters:**
- `startDate` (opcional): Fecha de inicio (ISO 8601)
- `endDate` (opcional): Fecha de fin (ISO 8601)
- `paymentType` (opcional): TRANSFER | MERCADOPAGO | CASH
- `year` (opcional): Año específico
- `eventId` (opcional): ID del evento específico

**Response:**
```json
{
  "summary": {
    "totalAmount": 125000.50,
    "totalCount": 45
  },
  "byType": [
    {
      "paymentType": "MERCADOPAGO",
      "totalAmount": 85000.00,
      "count": 25
    },
    {
      "paymentType": "TRANSFER", 
      "totalAmount": 35000.50,
      "count": 15
    },
    {
      "paymentType": "CASH",
      "totalAmount": 5000.00,
      "count": 5
    }
  ],
  "byMonth": [
    {
      "month": "2025-01-01T00:00:00.000Z",
      "total_amount": "45000",
      "count": "15"
    }
  ],
  "topEvents": [
    {
      "orderId": "uuid-order",
      "_sum": { "amount": 25000 },
      "_count": { "id": 8 },
      "event": {
        "id": "uuid-event",
        "topic": "Consagración 2025",
        "year": 2025
      }
    }
  ]
}
```

### 2. **Payments por Tipo**
**GET** `/payments/dashboard/by-type`

Obtiene todos los pagos filtrados por tipo.

**Query Parameters:**
- `type` (opcional): TRANSFER | MERCADOPAGO | CASH

**Response:**
```json
[
  {
    "id": "payment-uuid",
    "amount": 18000,
    "type": "CASH",
    "createdAt": "2025-01-10T...",
    "order": {
      "id": "order-uuid",
      "event": {
        "id": "event-uuid",
        "topic": "Consagración 2025",
        "year": 2025
      },
      "combos": [
        {
          "id": "combo-uuid",
          "name": "Individual",
          "price": 18000
        }
      ]
    },
    "user": {
      "id": "user-uuid",
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com"
    }
  }
]
```

### 3. **Payments por Rango de Fechas**
**GET** `/payments/dashboard/by-date-range`

Obtiene pagos en un rango de fechas específico.

**Query Parameters:**
- `startDate` (requerido): Fecha de inicio (ISO 8601)
- `endDate` (requerido): Fecha de fin (ISO 8601)

**Ejemplo:**
```
GET /payments/dashboard/by-date-range?startDate=2025-01-01&endDate=2025-01-31
```

### 4. **Payments Recientes**
**GET** `/payments/dashboard/recent`

Obtiene los pagos más recientes con información completa.

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 10)

**Ejemplo:**
```
GET /payments/dashboard/recent?limit=20
```

### 5. **Estadísticas Completas**
**GET** `/payments/dashboard/statistics`

Devuelve estadísticas detalladas de todos los pagos.

**Response:**
```json
{
  "total": {
    "amount": 125000.50,
    "count": 45,
    "average": 2777.79
  },
  "byYear": [
    {
      "year": 2025,
      "_sum": { "amount": 100000 },
      "_count": { "id": 35 },
      "_avg": { "amount": 2857.14 }
    },
    {
      "year": 2024,
      "_sum": { "amount": 25000.50 },
      "_count": { "id": 10 },
      "_avg": { "amount": 2500.05 }
    }
  ],
  "byType": [
    {
      "type": "MERCADOPAGO",
      "_sum": { "amount": 85000 },
      "_count": { "id": 25 },
      "_avg": { "amount": 3400 }
    }
  ],
  "monthlyGrowth": [
    {
      "month": "2024-07-01T00:00:00.000Z",
      "total_amount": "15000",
      "count": "5",
      "avg_amount": "3000"
    }
  ]
}
```

## Ejemplos de Uso

### Dashboard Completo
```bash
curl "http://localhost:3073/payments/dashboard/summary"
```

### Filtrar por Efectivo del 2025
```bash
curl "http://localhost:3073/payments/dashboard/summary?paymentType=CASH&year=2025"
```

### Pagos de MercadoPago únicamente
```bash
curl "http://localhost:3073/payments/dashboard/by-type?type=MERCADOPAGO"
```

### Pagos del último mes
```bash
curl "http://localhost:3073/payments/dashboard/by-date-range?startDate=2024-12-01&endDate=2024-12-31"
```

### Últimos 5 pagos
```bash
curl "http://localhost:3073/payments/dashboard/recent?limit=5"
```

### Estadísticas completas
```bash
curl "http://localhost:3073/payments/dashboard/statistics"
```

## Características Principales

✅ **Filtros Flexibles**: Todos los endpoints soportan múltiples filtros
✅ **Información Completa**: Incluye datos de eventos, combos y usuarios
✅ **Agregaciones**: Sumas, conteos y promedios automáticos
✅ **Ordenamiento**: Resultados ordenados por fecha (más recientes primero)
✅ **Soft Delete**: Solo muestra registros no eliminados
✅ **Performance**: Consultas optimizadas con índices de BD
✅ **Escalable**: Preparado para grandes volúmenes de datos

## Uso en Frontend

Estos endpoints están diseñados para ser consumidos directamente por dashboards de React/Vue/Angular:

1. **Summary** → Cards de totales y gráficos de resumen
2. **By Type** → Gráficos de torta por tipo de pago  
3. **By Date Range** → Gráficos de línea temporal
4. **Recent** → Tablas de actividad reciente
5. **Statistics** → KPIs y métricas de crecimiento

Todos los endpoints devuelven datos listos para ser graficados sin procesamiento adicional.