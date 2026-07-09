import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { KycStatusGate } from '@/components/kyc/shared/kyc-status-gate';
import { useKycGate } from '@/hooks/kyc/useKycGate';
import { useAuthStore } from '@/store/auth-store';

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('KycStatusGate', () => {
  it('shows a loading state while full-session initialization is unresolved', () => {
    act(() => {
      useAuthStore.getState().setAuthInitializing();
    });

    render(
      <KycStatusGate fallback={<p>Needs verification</p>}>
        <p>Protected action</p>
      </KycStatusGate>
    );

    expect(screen.getByRole('status')).toHaveTextContent(/Checking verification status/i);
    expect(screen.queryByText('Protected action')).not.toBeInTheDocument();
  });

  it('renders children when KYC is verified', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: true,
      });
    });

    render(
      <KycStatusGate fallback={<p>Needs verification</p>}>
        {(state) => (
          <p>
            Protected action {state.isRiskAssessed ? 'ready' : 'pending'}
          </p>
        )}
      </KycStatusGate>
    );

    expect(screen.getByText(/Protected action ready/i)).toBeInTheDocument();
    expect(screen.queryByText('Needs verification')).not.toBeInTheDocument();
  });

  it('renders fallback when KYC is not verified', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    render(
      <KycStatusGate fallback={(state) => <p>Needs verification: {String(state.isKycVerified)}</p>}>
        <p>Protected action</p>
      </KycStatusGate>
    );

    expect(screen.getByText('Needs verification: false')).toBeInTheDocument();
    expect(screen.queryByText('Protected action')).not.toBeInTheDocument();
  });
});

function UseKycGateProbe() {
  const state = useKycGate();
  return (
    <dl>
      <dt>KYC</dt>
      <dd>{String(state.isKycVerified)}</dd>
      <dt>Risk</dt>
      <dd>{String(state.isRiskAssessed)}</dd>
      <dt>Loading</dt>
      <dd>{String(state.isLoading)}</dd>
    </dl>
  );
}

describe('useKycGate', () => {
  it('exposes KYC, risk, and loading state from user flags', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    render(<UseKycGateProbe />);

    expect(screen.getByText('KYC').nextSibling).toHaveTextContent('true');
    expect(screen.getByText('Risk').nextSibling).toHaveTextContent('false');
    expect(screen.getByText('Loading').nextSibling).toHaveTextContent('false');
  });
});
