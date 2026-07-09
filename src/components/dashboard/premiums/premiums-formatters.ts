import { formatCurrency, formatDate } from '@/lib/utils';
import type { Policy } from '@/types/policies';

export function formatPolicyMoney(amount: string, currency = 'NGN') {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return amount;
  return formatCurrency(numericAmount, currency);
}

export function formatPolicyDate(value: string | null | undefined) {
  if (!value) return 'Not available';
  return formatDate(value);
}

export function getPrimaryPolicyDate(policy: Policy) {
  if (policy.purchased_at) {
    return {
      label: 'Bought on',
      value: formatPolicyDate(policy.purchased_at),
    };
  }

  if (policy.start_date) {
    return {
      label: 'Start date',
      value: formatPolicyDate(policy.start_date),
    };
  }

  return {
    label: 'Created on',
    value: formatPolicyDate(policy.created_at),
  };
}

export function formatRenewalFrequency(value: string) {
  const normalized = value.trim();
  if (!normalized) return 'Not available';
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

export function isDueSoonPolicy(policy: Policy) {
  return policy.display_status.toLowerCase().includes('due soon');
}
