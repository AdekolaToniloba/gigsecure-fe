import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PolicyCard } from '@/components/dashboard/premiums/policy-card';
import { PolicyDetailSlideOver } from '@/components/dashboard/premiums/policy-detail-slide-over';
import { PolicyFilterChips } from '@/components/dashboard/premiums/policy-filter-chips';
import { PolicyStatusBadge } from '@/components/dashboard/premiums/policy-status-badge';
import { PremiumsEmptyState } from '@/components/dashboard/premiums/premiums-empty-state';
import { ReportDownloadButton } from '@/components/dashboard/premiums/report-download-button';
import { renderWithProviders } from '@/__tests__/test-utils';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { policyFixtures } from '@/mocks/fixtures/policies';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import type { PremiumsFilter } from '@/types/policies';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const reportUrl = `${baseUrl}${ENDPOINTS.POLICIES.REPORT('pol-income-active')}`;

beforeEach(() => {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'policy-component-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:policy-report'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  document.body.style.overflow = '';
});

describe('premiums primitives', () => {
  it('renders status labels accessibly and not by color alone', () => {
    render(<PolicyStatusBadge status="Due Soon" />);

    expect(screen.getByText('Due Soon')).toBeVisible();
  });

  it('uses native filter buttons with selected state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PolicyFilterChips selected="all" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Expired' }));
    expect(onChange).toHaveBeenCalledWith('expired' satisfies PremiumsFilter);
  });

  it('renders policy cards with truthful API-backed fields and keyboard-accessible actions', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    renderWithProviders(
      <PolicyCard policy={policyFixtures[0]} onViewDetails={onViewDetails} />,
    );

    expect(screen.getByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeVisible();
    expect(screen.getByText(/AXA Mansard/)).toBeVisible();
    expect(screen.getByText('₦350,000.00')).toBeVisible();
    expect(screen.getByRole('button', { name: 'View Details' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Download Report' })).toBeDisabled();
    expect(screen.getByText(/backend confirms a PDF response/i)).toBeVisible();

    await user.tab();
    await user.keyboard('{Enter}');
    expect(onViewDetails).toHaveBeenCalledWith(policyFixtures[0]);
  });

  it('renders empty-state CTAs to existing routes', () => {
    render(<PremiumsEmptyState />);

    expect(screen.getByRole('heading', {
      name: "You haven't activated any protection plans yet",
    })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Explore Recommended Plans' })).toHaveAttribute(
      'href',
      '/marketplace',
    );
    expect(screen.getByRole('link', { name: 'View My Risk Assessment' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );
  });

  it('handles report unavailable, success, and error states', async () => {
    const user = userEvent.setup();
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    renderWithProviders(
      <ReportDownloadButton policyId="pol-income-active" isAvailable />,
    );

    await user.click(screen.getByRole('button', { name: 'Download Report' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Policy report downloaded.'),
    );
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:policy-report');
    expect(appendSpy).toHaveBeenCalled();

    server.use(
      http.get(reportUrl, () =>
        HttpResponse.json({ detail: 'Policy report is unavailable.' }, { status: 400 })
      )
    );

    await user.click(screen.getByRole('button', { name: 'Download Report' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Policy report is unavailable.'),
    );
  });

  it('prevents duplicate report downloads while one request is in flight', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get(reportUrl, async () => {
        requests += 1;
        await delay(80);
        return new HttpResponse('%PDF-1.4\nreport\n%%EOF', {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        });
      })
    );

    renderWithProviders(
      <ReportDownloadButton policyId="pol-income-active" isAvailable />,
    );

    const button = screen.getByRole('button', { name: 'Download Report' });
    await user.dblClick(button);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Policy report downloaded.'),
    );
    expect(requests).toBe(1);
  });

  it('traps focus, restores focus, and closes slide-over by Escape, backdrop, and close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    function Harness() {
      const [isOpen, setIsOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>Open policy</button>
          <PolicyDetailSlideOver
            isOpen={isOpen}
            title="Income Shield"
            description="AXA Mansard policy details"
            onClose={() => {
              onClose();
              setIsOpen(false);
            }}
          >
            <button type="button">Retry details</button>
            <button type="button">Download Report</button>
          </PolicyDetailSlideOver>
        </>
      );
    }

    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open policy' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Income Shield' });
    const closeButton = within(dialog).getByRole('button', { name: 'Close policy details' });
    expect(document.body.style.overflow).toBe('hidden');
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(within(dialog).getByRole('button', { name: 'Download Report' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');

    await user.click(opener);
    await user.click(screen.getByTestId('policy-detail-slide-over-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.click(opener);
    await user.click(screen.getByRole('button', { name: 'Close policy details' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
