
# Seed

```bash
npx ts-node prisma/seed.ts
```

# Referencia

- [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers/panel/app)

---

# Flujo de Usuario

- El usuario se registra y se le asigna un rol por defecto `<USER>`.  
- Puede acceder a los datos de su entrada.  
- Puede crear una cuenta con su correo y contraseña, o mediante Auth0 con Google.  
- El `<SUPERUSER>` puede asignar el rol `<ADMIN>`.  
- El `<ADMIN>` puede asignar cualquier rol, **exceptuando** `<SUPERUSER>` y `<ADMIN>` (no puede replicarse ni crear superusuarios).

---

# Flujo de Compra

## 1. Solicitud de Combos

- El frontend solicita los combos al backend.
- El backend verifica:
  - Si el período corresponde a una preventa.
  - Si aún hay entradas disponibles.
- Si todo es válido, se devuelven los datos al frontend.
- El usuario elige el medio de pago:
  - **Mercado Pago**, con un recargo del 27%.
  - **Transferencia bancaria**, sin recargo.

---

## 2. Flujo de Mercado Pago

- Al cargar los datos del pedido, se envían al backend.
- El backend crea una preferencia de pago con los ítems.
- Se devuelve una URL de pago y se redirecciona al usuario.
- Se registra una orden de pago en la base de datos.

### Webhook de Aprobación

- Verifica que la notificación proviene de Mercado Pago.
- Si es válida, agrega los invitados incluidos en la metadata a la base de datos.


$ curl --url "smtp://smtp.zoho.com:587" --ssl-reqd --mail-from "equipo@consagradosajesus.com" --mail-rcpt "brianpadilla.work@gmail.com" --upload-file correo.txt --user "equipo@consagradosajesus.com:1XQQUrz8QgLV" --insecure

---

## 3. Flujo de Transferencia Bancaria

- El usuario selecciona "Transferencia".
- Completa su email y CUIL.
- Se crea una orden de pago con los datos de los invitados.

### Confirmación Manual del Pago

- Se envía un email al usuario con un botón para confirmar la transferencia.
- Al hacer clic, se verifica:
  - Que el email coincida con la cuenta.
  - Que el CUIL coincida.
  - Que el valor transferido (redondeado) sea correcto.
- Si todo coincide:
  - Se crea un pago.
  - Se agregan los invitados a la tabla `invites`.
- Si no coincide:
  - Se guarda en una tabla de pagos pendientes para revisión manual.

---

## Notificaciones por Email

- Al crear un usuario (bienvenida).
- Al generar un pago, con el detalle de entradas e invitados.
- Confirmación de transferencia.
- Envío de mensajes masivos por parte del `<ADMIN>` a `<USER>`.
- Recordatorios para usuarios que asistieron en años anteriores.

# API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Events](#events)
- [Combos](#combos)
- [Invitees](#invitees)
- [Payments](#payments)
- [MercadoPago](#mercadopago)
- [Transfers](#transfers)
- [Mail](#mail)

---

## Authentication

### Login
- **POST** `/auth/login`
  - Authenticate a user with email and password
  - Body: `{ email: string, password: string }`
  - Returns: JWT token

### Register
- **POST** `/auth/register`
  - Register a new user
  - Body: `RegisterUserDto`
  - Returns: JWT token

### Get User Profile
- **GET** `/auth/profile`
  - Get authenticated user's profile
  - Requires: Authentication
  - Returns: User profile

---

## Users

### Get All Users
- **GET** `/users`
  - Get all users (admin only)
  - Returns: Array of users

### Get User by ID
- **GET** `/users/:id`
  - Get user by ID
  - Returns: User details

### Create User
- **POST** `/users`
  - Create a new user (admin only)
  - Body: `CreateUserDto`
  - Returns: Created user

---

## Events

### Get All Events
- **GET** `/events`
  - Get all events
  - Returns: Array of events

### Get Current Event
- **GET** `/events/current`
  - Get current year's event
  - Returns: Event details

### Get Event by ID
- **GET** `/events/:id`
  - Get event by ID
  - Returns: Event details

### Create Event
- **POST** `/events`
  - Create a new event (admin only)
  - Body: `CreateEventDto`
  - Returns: Created event

### Update Event
- **PUT** `/events/:id`
  - Replace all event data
  - Body: `CreateEventDto`
  - Returns: Updated event

### Partial Update Event
- **PATCH** `/events/:id`
  - Partially update event data
  - Body: `UpdateEventDto`
  - Returns: Updated event

---

## Combos

### Get All Combos
- **GET** `/combos`
  - Get all available combos
  - Returns: Array of combos

### Get Combo by ID
- **GET** `/combos/:id`
  - Get combo by ID
  - Returns: Combo details

### Create Combo
- **POST** `/combos`
  - Create a new combo (admin only)
  - Body: `CreateComboDto`
  - Returns: Created combo

### Update Combo
- **PATCH** `/combos/:id`
  - Update combo details
  - Body: `UpdateComboDto`
  - Returns: Updated combo

### Delete Combo
- **DELETE** `/combos/:id`
  - Delete a combo (admin only)
  - Returns: Success message

---

## Invitees

### Get All Invitees
- **GET** `/invitees`
  - Get all invitees with optional filters
  - Query Params: `FilterInviteesDto`
  - Returns: Array of invitees

### Mark Attendance
- **PATCH** `/invitees/:id/attendance`
  - Mark an invitee's attendance
  - Body: `MarkAttendanceDto`
  - Returns: Updated invitee record

---

## Payments

### Get All Payments
- **GET** `/payments`
  - Get all payments
  - Returns: Array of payments

### Get Payment by ID
- **GET** `/payments/:id`
  - Get payment by ID
  - Returns: Payment details

### Create Payment
- **POST** `/payments`
  - Create a new payment
  - Body: `CreatePaymentDto`
  - Returns: Created payment

### Update Payment
- **PUT** `/payments/:id`
  - Update payment details
  - Body: `UpdatePaymentDto`
  - Returns: Updated payment

### Delete Payment
- **DELETE** `/payments/:id`
  - Delete a payment
  - Returns: Success message

---

## MercadoPago

### Create Payment Preference
- **POST** `/mercadopago/preference`
  - Create a MercadoPago payment preference
  - Body: `CreatePreferenceDto`
  - Returns: Payment URL

### Process Webhook Notification
- **POST** `/mercadopago/webhook/payment`
  - Handle MercadoPago webhook notifications
  - Body: Raw notification data
  - Returns: Processing result

### Get Recent Payments
- **GET** `/mercadopago/movements`
  - Get payments from the last 20 days
  - Returns: Array of payment movements

---

## Transfers

### Get Approved Transfers
- **GET** `/transfers/approved`
  - Get approved transfers within a date range
  - Query Params: 
    - `begin`: Start date (ISO format)
    - `end`: End date (ISO format)
    - `cuil`: CUIL filter (optional)
  - Returns: Array of approved transfers

### Verify MercadoPago Transfer
- **GET** `/transfers/verifyTransferMercadoPago`
  - Verify a MercadoPago transfer
  - Body: 
    - `orderId`: string
    - `paymentId`: number
  - Returns: Verification result

### Verify Other Platform Transfer
- **GET** `/transfers/verifyTransferDeOtrasPlataformas`
  - Verify a transfer from other platforms
  - Body:
    - `orderId`: string
    - `paymentId`: string
  - Returns: Verification result

### Create Transfer Order
- **POST** `/transfers/create-transfer-order`
  - Create a new transfer order
  - Body: `CreatePreferenceDto`
  - Returns: Created transfer order

---

## Mail

### Send Email
- **POST** `/mail/send`
  - Send an email with HTML template
  - Body: 
    ```typescript
    {
      template: string;       // Template name
      to: string[];            // Recipient emails
      context: Record<string, any>; // Template variables
      subject?: string;        // Optional email subject
      attachments?: any[];      // Optional attachments
    }
    ```
  - Returns: Success message

---

## Notes
- All endpoints that modify data (POST, PUT, PATCH, DELETE) require authentication
- Admin-only endpoints are marked as such in their descriptions
- Dates should be in ISO 8601 format (e.g., "2023-01-01T00:00:00.000Z")

## Authentication
- Most endpoints require a valid JWT token in the `Authorization` header
- Token format: `Bearer <token>`

## Error Responses
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

# Tareas
- agregar roles de usuario
- agregar swager
- realizar crud de ` <combos> <invitados> <ordenes[create]> <eventos> <users> <preventa>`
- realizar flujo de transferencia
- envio de email con los datos del combo
- cron para eliminar ordenes de tipo mercado pago que esten en pending por 20 dias
- cron para eliminar ordenes de typo transacction que tesn en pending hace 15 dias
- crear un enpoint para aprobar ordenes de type tranfer 
- guanrdar invitados en ambos casos
- agrefar a crear orden que verifique si el evento ya puede vender
- verificar armar las preventas y descontar al seoeccionar un typo de transaccion 