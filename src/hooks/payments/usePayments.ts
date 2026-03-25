import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';
import { QUERY_KEYS } from '@/lib/constants';

export function usePaymentHistory() {
  return useQuery({
    queryKey: QUERY_KEYS.PAYMENTS_HISTORY,
    queryFn: ({ signal }) => paymentsService.getPaymentHistory(signal),
    staleTime: 0,
    throwOnError: true,
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PAYMENT(id),
    queryFn: ({ signal }) => paymentsService.getPayment(id, signal),
    staleTime: 0, // Payment status is dynamic
    throwOnError: true,
    enabled: !!id,
  });
}

export function useInitializePayment() {
  return useMutation({
    mutationFn: () => paymentsService.initializePayment(),
  });
}
