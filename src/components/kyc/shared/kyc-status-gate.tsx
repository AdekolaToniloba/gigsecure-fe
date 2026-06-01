'use client';

import type { ReactNode } from 'react';
import { useKycGate, type KycGateState } from '@/hooks/kyc/useKycGate';

type Renderable = ReactNode | ((state: KycGateState) => ReactNode);

type KycStatusGateProps = {
  children: Renderable;
  fallback?: Renderable;
  loadingFallback?: ReactNode;
};

function renderNode(node: Renderable | undefined, state: KycGateState) {
  return typeof node === 'function' ? node(state) : node;
}

export function KycStatusGate({
  children,
  fallback = null,
  loadingFallback = (
    <div role="status" aria-live="polite" className="text-sm text-primary">
      Checking verification status...
    </div>
  ),
}: KycStatusGateProps) {
  const state = useKycGate();

  if (state.isLoading) return <>{loadingFallback}</>;
  if (!state.isKycVerified) return <>{renderNode(fallback, state)}</>;

  return <>{renderNode(children, state)}</>;
}
