import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { QUERY_KEYS } from '@/lib/constants';

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: ({ signal }) => productsService.listProducts(signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS_FEATURED,
    queryFn: ({ signal }) => productsService.getFeaturedProducts(signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT(id),
    queryFn: ({ signal }) => productsService.getProduct(id, signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
    enabled: !!id,
  });
}
