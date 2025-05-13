// src/orders/order-status.enum.ts
export enum OrderStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  // Si en el futuro añade estados extra, aquí agréguelos, p. ej.:
  // CANCELLED = 'cancelled',
  // REFUNDED  = 'refunded',
}
