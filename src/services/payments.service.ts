import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  paymentSchema,
  paymentsHistoryResponseSchema,
  initializePaymentResponseSchema,
  type Payment,
  type InitializePaymentResponse,
} from '@/lib/validators/payments';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const paymentsService = {
  async initializePayment(signal?: AbortSignal): Promise<InitializePaymentResponse> {
    const { data } = await apiClient.post(ENDPOINTS.PAYMENTS.INITIALIZE, {}, { signal });
    return parseOrThrow(initializePaymentResponseSchema, data, 'paymentsService.initializePayment');
  },

  async getPayment(id: string, signal?: AbortSignal): Promise<Payment> {
    const { data } = await apiClient.get(ENDPOINTS.PAYMENTS.DETAIL(id), { signal });
    return parseOrThrow(paymentSchema, data, 'paymentsService.getPayment');
  },

  async getPaymentHistory(signal?: AbortSignal): Promise<Payment[]> {
    const { data } = await apiClient.get(ENDPOINTS.PAYMENTS.HISTORY, { signal });
    return parseOrThrow(paymentsHistoryResponseSchema, data, 'paymentsService.getPaymentHistory');
  },
};
