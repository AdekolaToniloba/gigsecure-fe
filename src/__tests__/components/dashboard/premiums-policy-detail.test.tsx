import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PolicyCard } from '@/components/dashboard/premiums/policy-card';
import { PolicyDetailContent } from '@/components/dashboard/premiums/policy-detail-content';
import { PolicyDetailPanel } from '@/components/dashboard/premiums/policy-detail-panel';
import { PolicyDetailSlideOver } from '@/components/dashboard/premiums/policy-detail-slide-over';
import { renderWithProviders } from '@/__tests__/test-utils';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { policyFixtures } from '@/mocks/fixtures/policies';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import type { Policy } from '@/types/policies';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const policiesUrl = `${baseUrl}${ENDPOINTS.POLICIES.LIST}`;

beforeEach(() => {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'policy-detail-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
  document.body.style.overflow = '';
});

describe('policy detail panel', () => {
  it('opens from a card click, starts the detail query, and restores focus on Escape', async () => {
    const user = userEvent.setup();
    let detailRequests = 0;
    server.use(
      http.get(`${policiesUrl}/:id`, async ({ params }) => {
        detailRequests += 1;
        await delay(80);
        return HttpResponse.json(
          policyFixtures.find((policy) => policy.id === params.id) ?? policyFixtures[0],
        );
      })
    );

    function Harness() {
      const [selected, setSelected] = React.useState<Policy | null>(null);
      return (
        <>
          <PolicyCard policy={policyFixtures[0]} onViewDetails={setSelected} />
          <PolicyDetailPanel selectedPolicy={selected} onClose={() => setSelected(null)} />
        </>
      );
    }

    renderWithProviders(<Harness />);
    const opener = screen.getByRole('button', { name: 'View Details' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Income Shield for Gig Workers' });
    await waitFor(() => expect(dialog).toBeVisible());
    expect(screen.getByText('Refreshing policy details...')).toBeVisible();
    await waitFor(() => expect(detailRequests).toBe(1));
    expect(await screen.findByText('Coverage details')).toBeVisible();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it('renders detail loading and error retry states when no fallback data exists', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get(`${policiesUrl}/missing-policy`, () => {
        requests += 1;
        return HttpResponse.json({ detail: 'Policy not found' }, { status: 404 });
      })
    );

    renderWithProviders(
      <PolicyDetailSlideOver
        isOpen
        title="Policy details"
        description="Missing policy details"
        onClose={vi.fn()}
      >
        <PolicyDetailContent policyId="missing-policy" />
      </PolicyDetailSlideOver>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading policy details...');
    expect(await screen.findByRole('alert')).toHaveTextContent('Policy not found');
    expect(requests).toBe(1);

    server.use(
      http.get(`${policiesUrl}/missing-policy`, () => HttpResponse.json(policyFixtures[0]))
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Income Shield for Gig Workers')).toBeVisible();
  });

  it('renders only authoritative policy fields and marks unsupported details unavailable', async () => {
    renderWithProviders(
      <PolicyDetailContent
        policyId="pol-income-active"
        fallbackPolicy={policyFixtures[0]}
      />,
    );

    expect(await screen.findByText('Income Shield for Gig Workers')).toBeVisible();
    expect(screen.getByText('Coverage amount')).toBeVisible();
    expect(screen.getByText('Premium / monthly')).toBeVisible();
    expect(screen.getByText('Payout Type')).toBeVisible();
    expect(screen.getByText('Not available')).toBeVisible();
    expect(screen.getByText(/policy document link is not available/i)).toBeVisible();
    expect(screen.queryByText(/Next payment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/What this plan covers/i)).not.toBeInTheDocument();
  });
});
