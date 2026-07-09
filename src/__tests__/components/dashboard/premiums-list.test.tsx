import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PremiumsList } from '@/components/dashboard/premiums/premiums-list';
import { renderWithProviders } from '@/__tests__/test-utils';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { policyFixtures } from '@/mocks/fixtures/policies';
import { policyHandlerScenarios } from '@/mocks/handlers/policies';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const policiesUrl = `${baseUrl}${ENDPOINTS.POLICIES.LIST}`;

beforeEach(() => {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'policy-list-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
});

describe('PremiumsList', () => {
  it('renders all policies and opens details from click and keyboard', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    renderWithProviders(<PremiumsList onViewDetails={onViewDetails} />);

    expect(screen.getByRole('status', { name: 'Loading premiums' })).toBeVisible();
    expect(await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Equipment Protection Plus' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Flexible Health Support' })).toBeVisible();

    await user.click(screen.getAllByRole('button', { name: 'View Details' })[0]);
    expect(onViewDetails).toHaveBeenCalledWith(policyFixtures[0]);

    onViewDetails.mockClear();
    screen.getAllByRole('button', { name: 'View Details' })[1].focus();
    await user.keyboard('{Enter}');
    expect(onViewDetails).toHaveBeenCalledWith(policyFixtures[1]);
  });

  it('uses documented server status_filter for active and expired filters', async () => {
    const user = userEvent.setup();
    const seenFilters: Array<string | null> = [];

    server.use(
      http.get(policiesUrl, ({ request }) => {
        const statusFilter = new URL(request.url).searchParams.get('status_filter');
        seenFilters.push(statusFilter);
        return HttpResponse.json({
          items: statusFilter
            ? policyFixtures.filter((policy) => policy.status === statusFilter)
            : policyFixtures,
        });
      })
    );

    renderWithProviders(<PremiumsList onViewDetails={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' });

    await user.click(screen.getByRole('button', { name: 'All Active' }));
    await screen.findByRole('heading', { name: 'Equipment Protection Plus' });
    expect(screen.queryByRole('heading', { name: 'Flexible Health Support' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expired' }));
    await screen.findByRole('heading', { name: 'Flexible Health Support' });

    await waitFor(() => expect(seenFilters).toEqual([null, 'active', 'expired']));
  });

  it('drives Due Soon from display_status without sending a raw server filter', async () => {
    const user = userEvent.setup();
    const seenFilters: Array<string | null> = [];

    server.use(
      http.get(policiesUrl, ({ request }) => {
        seenFilters.push(new URL(request.url).searchParams.get('status_filter'));
        return HttpResponse.json({ items: policyFixtures });
      })
    );

    renderWithProviders(<PremiumsList onViewDetails={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' });

    await user.click(screen.getByRole('button', { name: 'Due Soon' }));
    expect(await screen.findByRole('heading', { name: 'Equipment Protection Plus' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Income Shield for Gig Workers' })).not.toBeInTheDocument();
    expect(seenFilters).toEqual([null]);
  });

  it('renders account empty state only for an unfiltered empty list', async () => {
    server.use(policyHandlerScenarios.listEmpty);

    renderWithProviders(<PremiumsList onViewDetails={vi.fn()} />);

    expect(await screen.findByRole('heading', {
      name: "You haven't activated any protection plans yet",
    })).toBeVisible();
  });

  it('renders no-results state for filtered empty lists', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(policiesUrl, ({ request }) => {
        const statusFilter = new URL(request.url).searchParams.get('status_filter');
        return HttpResponse.json({
          items: statusFilter === 'expired' ? [] : policyFixtures,
        });
      })
    );

    renderWithProviders(<PremiumsList onViewDetails={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' });

    await user.click(screen.getByRole('button', { name: 'Expired' }));

    expect(await screen.findByRole('heading', { name: 'No premiums match this filter' })).toBeVisible();
    expect(screen.queryByRole('heading', {
      name: "You haven't activated any protection plans yet",
    })).not.toBeInTheDocument();
  });

  it('renders an accessible error state with retry', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(policiesUrl, () =>
        HttpResponse.json({ detail: 'Premiums are unavailable.' }, { status: 403 })
      )
    );

    renderWithProviders(<PremiumsList onViewDetails={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Premiums are unavailable.');
    server.use(policyHandlerScenarios.listSuccess);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeVisible();
  });

  it('keeps filter and action rows mobile-friendly', async () => {
    renderWithProviders(<PremiumsList onViewDetails={vi.fn()} />);

    const filterGroup = screen.getByRole('group', { name: 'Premium filters' });
    expect(filterGroup).toHaveClass('overflow-x-auto');
    expect(await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'View Details' })[0].closest('div')).toHaveClass(
      'flex-col',
      'sm:flex-row',
      'sm:flex-wrap',
    );
  });
});
