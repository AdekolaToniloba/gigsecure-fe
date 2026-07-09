import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  emptyProfileResponseFixture,
  fullProfileResponseFixture,
} from '@/mocks/fixtures/profile';
import { ProfileFieldRow } from '@/components/dashboard/profile/profile-field-row';
import { ProfileTabs } from '@/components/dashboard/profile/profile-tabs';
import { RefreshInsightsCard } from '@/components/dashboard/profile/refresh-insights-card';
import { RiskSectionCard } from '@/components/dashboard/profile/risk-section-card';
import { UserSummaryHeader } from '@/components/dashboard/profile/user-summary-header';

function ProfileTabsHarness() {
  const [activeTab, setActiveTab] = React.useState<'personal-information' | 'risk-data' | 'security'>(
    'personal-information',
  );

  return (
    <ProfileTabs
      activeTab={activeTab}
      onChange={setActiveTab}
      tabs={[
        {
          id: 'personal-information',
          label: 'Personal Information',
          content: <div>Personal panel</div>,
        },
        {
          id: 'risk-data',
          label: 'Risk Data',
          content: <div>Risk panel</div>,
        },
        {
          id: 'security',
          label: 'Security',
          content: <div>Security panel</div>,
        },
      ]}
    />
  );
}

describe('profile primitives', () => {
  it('renders semantic tabs and supports keyboard navigation and activation', async () => {
    const user = userEvent.setup();
    render(<ProfileTabsHarness />);

    const personalTab = screen.getByRole('tab', { name: 'Personal Information' });
    const riskTab = screen.getByRole('tab', { name: 'Risk Data' });
    const securityTab = screen.getByRole('tab', { name: 'Security' });

    expect(screen.getByRole('tablist', { name: 'Profile sections' })).toBeInTheDocument();
    expect(personalTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Personal Information' })).toHaveTextContent(
      'Personal panel',
    );

    personalTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(riskTab).toHaveFocus();
    expect(riskTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Risk Data' })).toHaveTextContent('Risk panel');

    await user.keyboard('{End}');
    expect(securityTab).toHaveFocus();
    expect(securityTab).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(personalTab).toHaveFocus();
    expect(personalTab).toHaveAttribute('aria-selected', 'true');

    securityTab.focus();
    await user.keyboard('{Enter}');
    expect(securityTab).toHaveAttribute('aria-selected', 'true');

    personalTab.focus();
    await user.keyboard(' ');
    expect(personalTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows user summary fallbacks for missing profile picture, last name, and occupation', () => {
    render(
      <UserSummaryHeader
        profileResponse={{
          ...emptyProfileResponseFixture,
          user: {
            ...fullProfileResponseFixture.user,
            last_name: null,
          },
        }}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Not provided')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders neutral fallback copy for empty field values', () => {
    render(
      <dl>
        <ProfileFieldRow label="Phone number" value={null} />
      </dl>,
    );

    expect(screen.getByText('Phone number')).toBeInTheDocument();
    expect(screen.getByText('Not provided')).toHaveClass('text-slate-500');
  });

  it('surfaces unsupported risk data honestly and keeps completion text color-independent', () => {
    render(
      <RiskSectionCard
        title="Safety net & insurance history"
        subtitle="Current summary support only."
        actionLabel="Update"
        actionHref="/dashboard/risk-assessment"
        rows={[
          { label: 'Safety-net strength score', value: '48 out of 100' },
          {
            label: 'Insurance coverage',
            value: 'Not available from the current assessment summary.',
            unavailable: true,
          },
        ]}
      />,
    );

    expect(screen.getByText('Partial summary')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Update' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );
    expect(
      screen.getByText('Not available from the current assessment summary.'),
    ).toBeInTheDocument();
  });

  it('renders refresh insights tags, CTA, and optional timing copy', () => {
    render(
      <RefreshInsightsCard
        tags={['Income updated', 'Occupation updated']}
        lastGeneratedLabel="Last generated from your latest completed assessment."
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Your latest profile changes may affect this summary',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Income updated')).toBeInTheDocument();
    expect(screen.getByText('Occupation updated')).toBeInTheDocument();
    expect(screen.getByText('Last generated from your latest completed assessment.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Update assessment' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );
    expect(screen.getByText(/not updated in real time/i)).toBeInTheDocument();
  });
});
