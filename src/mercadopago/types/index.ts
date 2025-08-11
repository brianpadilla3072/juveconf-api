import { Payment } from 'mercadopago';

export type PaymentGetResponse = Awaited<ReturnType<Payment['get']>>;
