import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KycPage, { metadata } from '@/app/(app)/kyc/page';

vi.mock('@/components/kyc/kyc-route-controller', () => ({
  KycRouteController: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="kyc-route-controller">{children}</div>
  ),
}));

vi.mock('@/components/kyc/kyc-page', () => ({
  KycPageContent: () => <div data-testid="kyc-page-content">KYC page content</div>,
}));

describe('KycPage', () => {
  it('defines meaningful page metadata', () => {
    expect(metadata.title).toBe('KYC Verification | GigSecure');
    expect(metadata.description).toContain('NIN identity verification');
  });

  it('composes page content inside the KYC route controller', () => {
    render(<KycPage />);

    expect(screen.getByTestId('kyc-route-controller')).toBeInTheDocument();
    expect(screen.getByTestId('kyc-page-content')).toBeInTheDocument();
  });
});
