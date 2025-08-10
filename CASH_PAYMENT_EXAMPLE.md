# Endpoint de Pago en Efectivo - Ejemplo de Uso

## Endpoint Creado

**POST** `/transfers/create-cash-order`

## Descripción

Este endpoint permite crear una orden de pago en efectivo que sigue el mismo patrón que las transferencias bancarias. Al crear la orden, se envía un email al usuario con instrucciones de pago e incluye un link de verificación idéntico al template de transferencias.

## Request Body

```json
{
  "id": "combo-uuid-here",
  "email": "usuario@ejemplo.com",
  "cuil": "20123456789",
  "title": "Combo Familiar",
  "unit_price": 5000,
  "quantity": 1,
  "minPersons": 2,
  "maxPersons": 4,
  "attendees": [
    {
      "name": "Juan Pérez",
      "cuil": "20123456789"
    },
    {
      "name": "María González",
      "cuil": "27123456789"
    }
  ],
  "eventId": "event-uuid-here",
  "userId": "user-uuid-here" // opcional
}
```

## Response

```json
{
  "success": true,
  "orderID": "order-uuid-generated"
}
```

## Ejemplo cURL

```bash
curl -X POST http://localhost:3072/transfers/create-cash-order \
  -H "Content-Type: application/json" \
  -d '{
    "id": "combo-123",
    "email": "test@ejemplo.com",
    "cuil": "20123456789",
    "title": "Combo Familiar",
    "unit_price": 5000,
    "quantity": 1,
    "minPersons": 2,
    "maxPersons": 4,
    "attendees": [
      {
        "name": "Juan Pérez",
        "cuil": "20123456789"
      }
    ],
    "eventId": "event-123"
  }'
```

## Flujo de Pago en Efectivo

1. **Creación de Orden**: El usuario envía la solicitud al endpoint
2. **Validación**: Se verifica que no exista una orden pendiente similar
3. **Registro en Base de Datos**: Se crea la orden con `PaymentType.CASH` y estado `PENDING`
4. **Email Automático**: Se envía un email confirmando que la orden está en progreso con:
   - ID de la orden
   - Instrucciones específicas de pago en efectivo
   - Link de verificación para usar después del pago
5. **Response Simple**: Solo retorna éxito y ID de orden (consistente con otras formas de pago)

## Template de Email Incluye

- **Mensaje de Confirmación**: "Tu orden está en progreso"
- **ID de Orden**: Para presentar en el punto de venta
- **Instrucciones Claras**: 
  - Acercarse al punto de venta autorizado
  - Presentar DNI y ID de orden
  - Realizar el pago por el monto exacto
  - Guardar comprobante
- **Link de Verificación**: Para usar después del pago (incluido en el email, no en la response)
- **Consistencia**: Mismo formato que otros tipos de pago

## Cambios en Base de Datos

Se agregó `CASH` al enum `PaymentType` en el schema de Prisma:

```prisma
enum PaymentType {
  TRANSFER
  MERCADOPAGO
  CASH
}
```

## Integración con Sistema Existente

- **Reutiliza**: Misma lógica de validación y metadata que transferencias
- **Compatible**: Usa el mismo DTO (`CreatePreferenceDto`) 
- **Consistente**: Sigue el mismo patrón de verificación
- **Modular**: Se integra perfectamente con el flujo existente de órdenes

El endpoint está listo para uso en producción y mantiene la consistencia con el resto de la API.