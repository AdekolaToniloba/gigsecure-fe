import React from 'react';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { KycPendingState } from '@/components/kyc/status/kyc-pending-state';
import { KycRetryPanel } from '@/components/kyc/status/kyc-retry-panel';
import { KycStatusPanel } from '@/components/kyc/status/kyc-status-panel';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/__tests__/test-utils';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

function mockStatusResponse(body: Parameters<typeof HttpResponse.json>[0], status = 200) {
  server.use(
    http.get(`${baseUrl}/api/v1/kyc/status`, () => HttpResponse.json(body, { status }))
  );
}

describe('KycStatusPanel', () => {
  it('shows no-attempt state without rejection copy', async () => {
    mockStatusResponse({
      status: null,
      document_type: null,
      verified_at: null,
      rejection_reason: null,
    });

    renderWithProviders(<KycStatusPanel />);

    expect(await screen.findByText(/No verification attempt yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Details did not match records/i)).not.toBeInTheDocument();
  });

  it('shows pending state while verification is in progress', async () => {
    mockStatusResponse({
      status: 'pending',
      document_type: 'NIN',
      verified_at: null,
      rejection_reason: null,
    });

    renderWithProviders(<KycStatusPanel />);

    expect(await screen.findByText(/Verification in progress/i)).toBeInTheDocument();
  });

  it('shows verified state', async () => {
    mockStatusResponse({
      status: 'verified',
      document_type: 'NIN',
      verified_at: '2026-04-24T10:00:00Z',
      rejection_reason: null,
    });

    renderWithProviders(<KycStatusPanel />);

    expect(await screen.findByText(/Identity verified/i)).toBeInTheDocument();
  });

  it('shows rejected copy with guidance to double-check identity details', async () => {
    mockStatusResponse({
      status: 'rejected',
      document_type: 'NIN',
      verified_at: null,
      rejection_reason: 'Submitted details did not match identity records.',
    });

    renderWithProviders(<KycStatusPanel />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Details did not match records/i);
    expect(alert).toHaveTextContent(/Double-check your NIN slip or NIMC card/i);
  });

  it('shows failed copy without implying user fault', async () => {
    mockStatusResponse({
      status: 'failed',
      document_type: 'NIN',
      verified_at: null,
      rejection_reason: 'Verification could not be completed due to a technical issue.',
    });

    renderWithProviders(<KycStatusPanel />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Verification could not be completed/i);
    expect(alert).toHaveTextContent(/not caused by your details/i);
  });

  it('shows parsed API errors from the status query', async () => {
    mockStatusResponse({ detail: 'Unable to load KYC status.' }, 400);

    renderWithProviders(<KycStatusPanel />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load KYC status.');
  });
});

describe('KycPendingState', () => {
  it('shows long-running pending timeout copy', () => {
    renderWithProviders(<KycPendingState hasTimedOut />);

    expect(screen.getByRole('status')).toHaveTextContent(/taking longer than expected/i);
    expect(screen.getByRole('status')).toHaveTextContent(/stopped polling/i);
  });
});

describe('KycRetryPanel', () => {
  it('disables retry while cooldown is active and enables it after cooldown', async () => {
    const onRetry = vi.fn();
    const { rerender } = renderWithProviders(
      <KycRetryPanel
        status="rejected"
        reason="Submitted details did not match identity records."
        cooldownRemainingMs={60 * 60 * 1000}
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('button', { name: /Try again/i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/Retry available in/i);

    rerender(
      <KycRetryPanel
        status="rejected"
        reason="Submitted details did not match identity records."
        cooldownRemainingMs={0}
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('button', { name: /Try again/i })).toBeEnabled();
  });
});
