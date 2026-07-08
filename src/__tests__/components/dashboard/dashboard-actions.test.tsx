import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GettingStartedChecklist } from '@/components/dashboard/overview/getting-started-checklist';
import { RecommendedActions } from '@/components/dashboard/overview/recommended-actions';

function getAction(id: string): HTMLElement {
  const action = document.querySelector(`[data-action-id="${id}"]`);
  if (!(action instanceof HTMLElement)) throw new Error(`Missing action: ${id}`);
  return action;
}

describe('GettingStartedChecklist', () => {
  it.each([
    [false, false, false],
    [false, false, true],
    [false, true, false],
    [false, true, true],
    [true, false, false],
    [true, false, true],
    [true, true, false],
    [true, true, true],
  ])(
    'derives completion from risk=%s, kyc=%s, email=%s',
    (riskAssessed, kycVerified, emailVerified) => {
      render(
        <GettingStartedChecklist
          riskAssessed={riskAssessed}
          kycVerified={kycVerified}
          emailVerified={emailVerified}
        />,
      );

      expect(getAction('risk-assessment')).toHaveTextContent(
        riskAssessed ? 'Completed' : 'To do',
      );
      expect(getAction('kyc-verification')).toHaveTextContent(
        kycVerified ? 'Completed' : 'To do',
      );
      expect(getAction('email-verification')).toHaveTextContent(
        emailVerified ? 'Completed' : 'To do',
      );
      expect(getAction('marketplace')).toHaveTextContent('Available');
    },
  );

  it('uses only authoritative routes and keeps unverified email informational', () => {
    render(
      <GettingStartedChecklist
        riskAssessed={false}
        kycVerified={false}
        emailVerified={false}
      />,
    );

    expect(within(getAction('risk-assessment')).getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );
    expect(within(getAction('kyc-verification')).getByRole('link')).toHaveAttribute(
      'href',
      '/kyc',
    );
    expect(within(getAction('marketplace')).getByRole('link')).toHaveAttribute(
      'href',
      '/marketplace',
    );
    expect(within(getAction('email-verification')).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /profile|settings|verify your email/i }))
      .not.toBeInTheDocument();
  });

  it('removes completed actions from keyboard navigation while retaining non-color labels', async () => {
    const user = userEvent.setup();
    render(
      <GettingStartedChecklist riskAssessed kycVerified emailVerified />,
    );

    expect(screen.getAllByText('Completed')).toHaveLength(3);
    await user.tab();
    expect(screen.getByRole('link', { name: /Explore protection plans/i })).toHaveFocus();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});

describe('RecommendedActions', () => {
  it('renders backend recommendation strings as information rather than fake links', () => {
    const recommendations = [
      'Diversify your client base.',
      'Build an emergency fund covering three months.',
    ];
    render(<RecommendedActions recommendations={recommendations} kycVerified />);

    recommendations.forEach((recommendation) => {
      expect(screen.getByText(recommendation)).toBeVisible();
      expect(screen.getByText(recommendation).closest('a')).toBeNull();
    });
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Explore protection plans/i })).toHaveAttribute(
      'href',
      '/marketplace',
    );
  });

  it('adds a real KYC action only when verification is incomplete', () => {
    const { rerender } = render(<RecommendedActions recommendations={[]} kycVerified={false} />);

    expect(screen.getByRole('link', { name: /Complete KYC verification/i })).toHaveAttribute(
      'href',
      '/kyc',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'No personalized assessment recommendations are available yet.',
    );

    rerender(<RecommendedActions recommendations={[]} kycVerified />);
    expect(screen.queryByRole('link', { name: /Complete KYC verification/i }))
      .not.toBeInTheDocument();
  });

  it('preserves long recommendations in responsive, wrapping rows', () => {
    const recommendation = `Consider ${'income protection and client diversification '.repeat(30)}`.trim();
    render(<RecommendedActions recommendations={[recommendation]} kycVerified />);

    const section = screen.getByRole('region', { name: 'Recommended actions' });
    const text = screen.getByText(recommendation);
    expect(section).toHaveClass('min-w-0', 'overflow-hidden');
    expect(text).toHaveClass('break-words', '[overflow-wrap:anywhere]');
    expect(getAction('recommendation-0')).toHaveClass('min-w-0');
  });

  it('keeps only real actions in keyboard order', async () => {
    const user = userEvent.setup();
    render(
      <RecommendedActions
        recommendations={['Keep a larger safety buffer.']}
        kycVerified={false}
      />,
    );

    await user.tab();
    expect(screen.getByRole('link', { name: /Complete KYC verification/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: /Explore protection plans/i })).toHaveFocus();
  });
});
