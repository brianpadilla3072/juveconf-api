-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('LOCAL', 'AUTH0');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."EmailType" AS ENUM ('ORDEN_TRANSFER', 'ORDEN_CASH', 'TICKET_DOWNLOAD', 'PASSWORD_RESET', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'REVIEW', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('TRANSFER', 'MERCADOPAGO', 'CASH');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPERADMIN', 'DEVELOPER', 'ADMIN', 'EDITOR', 'COLLABORATOR', 'USER');

-- CreateTable
CREATE TABLE "public"."Combo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "eventId" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "maxPersons" INTEGER,
    "metadata" JSONB,
    "personsIncluded" INTEGER NOT NULL,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Egreso" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "notas" TEXT,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Egreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailQueue" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT,
    "template" TEXT,
    "context" JSONB,
    "emailType" "public"."EmailType" NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "salesStartDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "description" TEXT,
    "eventDays" JSONB,
    "eventEndDate" TIMESTAMP(3),
    "eventStartDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "salesEndDate" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ingreso" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "notas" TEXT,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invitee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuil" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT,
    "attendance" JSONB,
    "metadata" TEXT,

    CONSTRAINT "Invitee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" "public"."PaymentType" NOT NULL,
    "externalReference" TEXT,
    "metadataToken" TEXT,
    "preferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "cuil" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "comboId" TEXT NOT NULL,
    "orderSnapshot" JSONB,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."PaymentType" NOT NULL,
    "externalReference" TEXT,
    "userId" TEXT,
    "payerName" TEXT,
    "payerEmail" TEXT,
    "payerDni" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "payerPhone" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PreSale" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "description" TEXT,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,

    CONSTRAINT "PreSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PreSaleComboPrice" (
    "id" TEXT NOT NULL,
    "preSaleId" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreSaleComboPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "auth0Id" TEXT,
    "provider" "public"."AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "dni" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "givenName" TEXT,
    "familyName" TEXT,
    "nickname" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "picture" TEXT,
    "locale" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "requirePasswordChange" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Combo_eventId_isActive_idx" ON "public"."Combo"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Combo_eventId_name_key" ON "public"."Combo"("eventId", "name");

-- CreateIndex
CREATE INDEX "Egreso_year_fecha_idx" ON "public"."Egreso"("year", "fecha");

-- CreateIndex
CREATE INDEX "EmailQueue_createdAt_idx" ON "public"."EmailQueue"("createdAt");

-- CreateIndex
CREATE INDEX "EmailQueue_status_attempts_idx" ON "public"."EmailQueue"("status", "attempts");

-- CreateIndex
CREATE INDEX "Event_eventStartDate_idx" ON "public"."Event"("eventStartDate");

-- CreateIndex
CREATE INDEX "Event_salesStartDate_idx" ON "public"."Event"("salesStartDate");

-- CreateIndex
CREATE INDEX "Event_year_idx" ON "public"."Event"("year");

-- CreateIndex
CREATE INDEX "Ingreso_year_fecha_idx" ON "public"."Ingreso"("year", "fecha");

-- CreateIndex
CREATE INDEX "Invitee_cuil_idx" ON "public"."Invitee"("cuil");

-- CreateIndex
CREATE INDEX "Invitee_email_idx" ON "public"."Invitee"("email");

-- CreateIndex
CREATE INDEX "Invitee_orderId_idx" ON "public"."Invitee"("orderId");

-- CreateIndex
CREATE INDEX "Invitee_paymentId_idx" ON "public"."Invitee"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalReference_key" ON "public"."Order"("externalReference");

-- CreateIndex
CREATE INDEX "Order_comboId_idx" ON "public"."Order"("comboId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "public"."Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_cuil_idx" ON "public"."Order"("cuil");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "public"."Order"("email");

-- CreateIndex
CREATE INDEX "Order_eventId_idx" ON "public"."Order"("eventId");

-- CreateIndex
CREATE INDEX "Order_status_paymentType_idx" ON "public"."Order"("status", "paymentType");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "public"."Order"("userId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_type_idx" ON "public"."Payment"("type");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "PreSale_eventId_startDate_endDate_idx" ON "public"."PreSale"("eventId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PreSale_eventId_name_key" ON "public"."PreSale"("eventId", "name");

-- CreateIndex
CREATE INDEX "PreSaleComboPrice_comboId_idx" ON "public"."PreSaleComboPrice"("comboId");

-- CreateIndex
CREATE INDEX "PreSaleComboPrice_preSaleId_idx" ON "public"."PreSaleComboPrice"("preSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "PreSaleComboPrice_preSaleId_comboId_key" ON "public"."PreSaleComboPrice"("preSaleId", "comboId");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "public"."User"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "public"."User"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_dni_idx" ON "public"."User"("dni");

-- CreateIndex
CREATE INDEX "User_email_deletedAt_idx" ON "public"."User"("email", "deletedAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- AddForeignKey
ALTER TABLE "public"."Combo" ADD CONSTRAINT "Combo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailQueue" ADD CONSTRAINT "EmailQueue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailQueue" ADD CONSTRAINT "EmailQueue_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitee" ADD CONSTRAINT "Invitee_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitee" ADD CONSTRAINT "Invitee_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "public"."Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreSale" ADD CONSTRAINT "PreSale_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreSaleComboPrice" ADD CONSTRAINT "PreSaleComboPrice_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "public"."Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreSaleComboPrice" ADD CONSTRAINT "PreSaleComboPrice_preSaleId_fkey" FOREIGN KEY ("preSaleId") REFERENCES "public"."PreSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

