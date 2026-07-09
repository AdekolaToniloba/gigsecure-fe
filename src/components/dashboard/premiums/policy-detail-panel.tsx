'use client';

import { PolicyDetailContent } from '@/components/dashboard/premiums/policy-detail-content';
import { PolicyDetailSlideOver } from '@/components/dashboard/premiums/policy-detail-slide-over';
import type { Policy } from '@/types/policies';

type PolicyDetailPanelProps = {
  selectedPolicy: Policy | null;
  onClose: () => void;
  reportAvailable?: boolean;
};

export function PolicyDetailPanel({
  selectedPolicy,
  onClose,
  reportAvailable = false,
}: PolicyDetailPanelProps) {
  const title = selectedPolicy?.product.name ?? 'Policy details';
  const description = selectedPolicy
    ? `${selectedPolicy.product.provider_name} ${selectedPolicy.product.category} policy details`
    : 'Policy details';

  return (
    <PolicyDetailSlideOver
      isOpen={selectedPolicy !== null}
      title={title}
      description={description}
      onClose={onClose}
    >
      <PolicyDetailContent
        policyId={selectedPolicy?.id ?? null}
        fallbackPolicy={selectedPolicy}
        reportAvailable={reportAvailable}
      />
    </PolicyDetailSlideOver>
  );
}
