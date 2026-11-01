import { Connection } from 'mongoose';
import { paymentSchema } from './payment.model';
export function createPaymentModels(connection: Connection) {
  return { Payment: connection.model('Payment', paymentSchema) };
}
export type PaymentModels = ReturnType<typeof createPaymentModels>;
export async function initializeModels(models: PaymentModels): Promise<void> {
  await Promise.all(Object.values(models).map((model) => model.init()));
}
