
# JuveConf API

## Overview

RESTful API backend for the JuveConf (Juventud en Conferencia) event management system, built with NestJS and PostgreSQL. This API handles user authentication, event registration, payment processing through MercadoPago, and comprehensive order management.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Database Schema](#database-schema)
3. [Authentication & Security](#authentication--security)
4. [Business Logic & Flows](#business-logic--flows)
5. [Environment Setup](#environment-setup)
6. [Development](#development)
7. [Deployment](#deployment)

## Technology Stack

- **Framework**: NestJS 11.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **Payment Gateway**: MercadoPago SDK
- **Email Service**: Nodemailer with Handlebars templates
- **Validation**: class-validator, class-transformer
- **Security**: Helmet, bcrypt password hashing
- **Queue System**: Bull/BullMQ with Redis
- **API Documentation**: Swagger/OpenAPI

### Core Dependencies

```json
{
  "@nestjs/core": "^11.0.1",
  "@nestjs/jwt": "^11.0.0",
  "@nestjs/passport": "^11.0.5",
  "@prisma/client": "^6.7.0",
  "mercadopago": "^2.5.0",
  "bcrypt": "^5.1.1",
  "passport-jwt": "^4.0.1"
}
```

## Database Schema

### Entity Relationships

```
User (1:N) → Order (1:N) → Payment
Event (1:N) → Order, Combo
Order (M:N) → Combo
Payment (1:N) → Invitee
Order (1:N) → Invitee
```

### Core Models

#### User
```prisma
model User {
  id              String       @id @default(uuid())
  auth0Id         String?      @unique
  provider        AuthProvider @default(LOCAL)
  dni             String       @unique
  name            String
  email           String       @unique
  emailVerified   Boolean      @default(false)
  password        String?      // Optional for Auth0 users
  role            UserRole     @default(USER)
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  lastLogin       DateTime?
  deletedAt       DateTime?
}
```

### User Roles & Authorization

- **USER**: Default role, can access own data and create orders
- **COLLABORATOR**: Can view additional event information
- **EDITOR**: Can modify some event content
- **ADMIN**: Can approve orders and manage users (except SUPERADMIN creation)
- **DEVELOPER**: Full development access
- **SUPERADMIN**: Complete system access, can assign ADMIN roles

## Business Logic & Flows

### User Registration & Authentication

1. Users register with default USER role
2. Can authenticate via local credentials or Auth0 with Google
3. SUPERADMIN can assign ADMIN roles
4. ADMIN can assign any role except SUPERADMIN and ADMIN

### Purchase Flow Overview

#### 1. Combo Selection Process

- Frontend requests available combos from backend
- Backend validates:
  - Pre-sale period eligibility
  - Ticket availability for event capacity
- Valid combos returned with pricing options:
  - **MercadoPago**: 27% surcharge included
  - **Bank Transfer**: No additional charges

#### 2. MercadoPago Payment Flow

**Order Creation:**
- User submits order data to backend
- Backend creates payment preference with item details
- Payment URL generated and user redirected to MercadoPago
- Order registered in database with PENDING status

**Webhook Processing:**
- MercadoPago sends payment notifications to webhook endpoint
- Backend verifies notification authenticity
- On successful payment:
  - Order status updated to PAID
  - Payment record created
  - Invitees extracted from metadata and saved
  - Confirmation email sent with ticket download link

#### 3. Bank Transfer Flow

**Order Initiation:**
- User selects "Bank Transfer" option
- Provides email and CUIL (Argentine tax ID)
- Order created with invitee details

**Manual Confirmation Process:**
- Confirmation email sent with verification button
- User clicks to confirm transfer completion
- System validates:
  - Email matches order email
  - CUIL matches order CUIL  
  - Transfer amount matches expected total (with rounding tolerance)

**Payment Processing:**
- **Valid Transfer**: Payment created, invitees added to database
- **Invalid Transfer**: Saved to pending payments table for manual admin review

### Email Notification System

Automated emails triggered for:
- **User Registration**: Welcome message
- **Payment Confirmation**: Order details and invitee information
- **Transfer Confirmation**: Bank transfer verification
- **Admin Broadcasts**: Mass messaging to USER role accounts
- **Annual Reminders**: Re-engagement for previous year attendees

## Database Setup & Seeding

```bash
# Setup database schema
npx prisma migrate dev

# Seed initial data
npx ts-node prisma/seed.ts

# View database in browser
npx prisma studio --port 9000
```

## Reference Links

- [MercadoPago Developer Panel](https://www.mercadopago.com.ar/developers/panel/app)

# API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Events](#events)
- [Combos](#combos)
- [Invitees](#invitees)
- [Orders](#orders)
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
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "user@example.com", "password": "yourpassword"}'
    ```

### Register
- **POST** `/auth/register`
  - Register a new user
  - Body: `{ email: string, password: string, name: string }`
  - Returns: JWT token
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/auth/register \
      -H "Content-Type: application/json" \
      -d '{"email": "newuser@example.com", "password": "securepassword", "name": "New User"}'
    ```

### Get User Profile
- **GET** `/auth/profile`
  - Get authenticated user's profile
  - Requires: Authentication
  - Returns: User profile
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/auth/profile \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

---

## Users

### Get All Users
- **GET** `/users`
  - Get all users (admin only)
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Returns: Array of users
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/users \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Get User by ID
- **GET** `/users/:id`
  - Get user by ID
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Returns: User details
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/users/USER_ID \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Create User
- **POST** `/users`
  - Create a new user (admin only)
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Body: `{ email: string, password: string, name: string, role: UserRole }`
  - Returns: Created user
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/users \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -d '{"email": "newadmin@example.com", "password": "adminpass", "name": "Admin User", "role": "ADMIN"}'
    ```

---

## Events

### Get All Events
- **GET** `/events`
  - Get all events
  - Returns: Array of events
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/events
    ```

### Get Current Event
- **GET** `/events/current`
  - Get current year's event
  - Returns: Event details
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/events/current
    ```

### Get Event by ID
- **GET** `/events/:id`
  - Get event by ID
  - Returns: Event details
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/events/UUID_HERE
    ```

### Create Event
- **POST** `/events`
  - Create a new event (admin only)
  - Body: `{ title: string, description: string, date: string, location: string }`
  - Returns: Created event
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/events \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -d '{"title": "New Event", "description": "Event description", "date": "2024-12-31T23:59:59.999Z", "location": "Event Location"}'
    ```

### Update Event
- **PUT** `/events/:id`
  - Replace all event data
  - Body: `{ title: string, description: string, date: string, location: string }`
  - Returns: Updated event
  - Example cURL:
    ```bash
    curl -X PUT http://localhost:3072/events/UUID_HERE \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -d '{"title": "Updated Event", "description": "Updated description", "date": "2024-12-31T23:59:59.999Z", "location": "New Location"}'
    ```

### Partial Update Event
- **PATCH** `/events/:id`
  - Partially update event data
  - Body: Partial event object with fields to update
  - Returns: Updated event
  - Example cURL:
    ```bash
    curl -X PATCH http://localhost:3072/events/UUID_HERE \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -d '{"location": "Updated Location Only"}'
    ```

---

## Combos

### Get All Combos
- **GET** `/combos`
  - Get all available combos
  - Returns: Array of combos
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/combos
    ```

### Get Combo by ID
- **GET** `/combos/:id`
  - Get combo by ID
  - Returns: Combo details
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/combos/COMBO_ID
    ```

### Create Combo
- **POST** `/combos`
  - Create a new combo (admin only)
  - Body: `{ name: string, description: string, price: number, items: string[] }`
  - Returns: Created combo
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/combos \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -d '{"name": "Combo Familiar", "description": "Ideal para toda la familia", "price": 5000, "items": ["item1", "item2"]}'
    ```

### Update Combo
- **PATCH** `/combos/:id`
  - Update combo details
  - Body: Partial combo object with fields to update
  - Returns: Updated combo
  - Example cURL:
    ```bash
    curl -X PATCH http://localhost:3072/combos/COMBO_ID \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -d '{"price": 5500}'
    ```

### Delete Combo
- **DELETE** `/combos/:id`
  - Delete a combo
  - Returns: Success status
  - Example cURL:
    ```bash
    curl -X DELETE http://localhost:3072/combos/COMBO_ID \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

---

## Invitees

### Get All Invitees
- **GET** `/invitees`
  - Get all invitees with optional filters
  - Query Params: `{ eventId?: string, status?: string, search?: string }`
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Returns: Array of invitees
  - Example cURL:
    ```bash
    curl -X GET "http://localhost:3072/invitees?eventId=EVENT_ID&status=CONFIRMED" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Mark Attendance
- **PATCH** `/invitees/:id/attendance`
  - Mark an invitee's attendance
  - Body: `{ attended: boolean }`
  - Returns: Updated invitee
  - Example cURL:
    ```bash
    curl -X PATCH http://localhost:3072/invitees/INVITEE_ID/attendance \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -d '{"attended": true}'
    ```

---

## Orders

### Get Orders in Review
- **GET** `/orders/review`
  - Get all orders in review status
  - Returns: Array of orders
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/orders/review \ -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Get Pending Orders
- **GET** `/orders/pending`
  - Get all pending orders
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Returns: Array of orders
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/orders/pending \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Get Paid Orders
- **GET** `/orders/paid`
  - Get all paid orders
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Returns: Array of orders
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/orders/paid \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Approve Order
- **PUT** `/orders/:id/approve`
  - Approve an order
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Returns: Approved order
  - Example cURL:
    ```bash
    curl -X PUT http://localhost:3072/orders/ORDER_ID/approve \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Delete Order
- **DELETE** `/orders/:id`
  - Delete an order
  - Requires: Authentication (ADMIN, DEVELOPER, SUPERADMIN roles)
  - Returns: Success status
  - Example cURL:
    ```bash
    curl -X DELETE http://localhost:3072/orders/ORDER_ID \
      -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

---

## Payments

### Get All Payments
- **GET** `/payments`
  - Get all payments
  - Returns: Array of payments
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/payments
    ```

### Get Payment by ID
- **GET** `/payments/:id`
  - Get payment by ID
  - Returns: Payment details
  - Example cURL:
    ```bash
    curl -X GET http://localhost:3072/payments/PAYMENT_ID
    ```

### Create Payment
- **POST** `/payments`
  - Create a new payment
  - Body: Payment details
  - Returns: Created payment
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/payments \
      -H "Content-Type: application/json" \
      -d '{"amount": 1000, "currency": "ARS", "status": "PENDING"}'
    ```

### Update Payment
- **PUT** `/payments/:id`
  - Update payment details
  - Body: Payment details
  - Returns: Updated payment
  - Example cURL:
    ```bash
    curl -X PUT http://localhost:3072/payments/PAYMENT_ID \
      -H "Content-Type: application/json" \
      -d '{"status": "COMPLETED"}'
    ```

### Delete Payment
- **DELETE** `/payments/:id`
  - Delete a payment
  - Returns: Success status
  - Example cURL:
    ```bash
    curl -X DELETE http://localhost:3072/payments/PAYMENT_ID
    ```

---

## MercadoPago

### Create Payment Preference
- **POST** `/mercadopago/preference`
  - Create a MercadoPago payment preference
  - Body: `{ items: Array<{ title: string, quantity: number, unit_price: number }> }`
  - Returns: Payment URL and preference ID
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/mercadopago/preference \
      -H "Content-Type: application/json" \
      -d '{"items": [{"title": "Entrada General", "quantity": 1, "unit_price": 1000}]}'
    ```

### Webhook Notification
- **POST** `/mercadopago/webhook/payment`
  - Handle MercadoPago payment notifications
  - Body: Raw notification data from MercadoPago
  - Returns: Processing status
  - Note: This endpoint is called by MercadoPago, not directly by clients

---

## Transfers

### Create Transfer Order
- **POST** `/transfers/create-transfer-order`
  - Create a transfer order
  - Body: Same as MercadoPago preference DTO
  - Returns: Transfer order details
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/transfers/create-transfer-order \
      -H "Content-Type: application/json" \
      -d '{"items": [{"title": "Entrada General", "quantity": 1, "unit_price": 1000}], "payer": {"email": "user@example.com"}}'
    ```

### Approve Order
- **POST** `/transfers/approve-order`
  - Approve a transfer order
  - Body: `{ orderId: string, email: string, cuil: string }`
  - Returns: Approved order
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/transfers/approve-order \
      -H "Content-Type: application/json" \
      -d '{"orderId": "ORDER_ID", "email": "user@example.com", "cuil": "20123456789"}'
    ```

---

## Mail

### Send Email
- **POST** `/mail/send`
  - Send an email
  - Body: `{ to: string, subject: string, text: string, html?: string }`
  - Returns: Success status
  - Example cURL:
    ```bash
    curl -X POST http://localhost:3072/mail/send \
      -H "Content-Type: application/json" \
      -d '{"to": "recipient@example.com", "subject": "Test Email", "text": "This is a test email"}'
    ```
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