import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfilePageController } from '@/components/dashboard/profile/profile-page-controller';
import { getRiskInsightChangeTags } from '@/components/dashboard/profile/risk-insights-stale';
import { fullProfileResponseFixture } from '@/mocks/fixtures/profile';

vi.mock('@/hooks/user/useUserProfile', () => ({
  useUserProfile: vi.fn(),
}));

vi.mock('@/components/dashboard/profile/personal-information-section', () => ({
  PersonalInformationSection: ({
    onAssessmentRelevantUpdate,
  }: {
    onAssessmentRelevantUpdate?: (fields: Array<'phone_number' | 'average_monthly_income' | 'occupation'>) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onAssessmentRelevantUpdate?.(['phone_number'])}>
        Non relevant update
      </button>
      <button
        type="button"
        onClick={() => onAssessmentRelevantUpdate?.(['average_monthly_income', 'occupation'])}
      >
        Relevant update
      </button>
    </div>
  ),
}));

vi.mock('@/components/dashboard/profile/risk-data-section', () => ({
  RiskDataSection: ({
    staleFields,
    staleTags,
  }: {
    staleFields?: string[];
    staleTags?: string[];
  }) => (
    <div>
      <div>Stale fields: {staleFields?.join(', ') || 'none'}</div>
      <div>Stale tags: {staleTags?.join(', ') || 'none'}</div>
      <a href="/dashboard/risk-assessment">Update assessment</a>
    </div>
  ),
}));

vi.mock('@/components/dashboard/profile/security-section', () => ({
  SecuritySection: () => <div>Security section</div>,
}));

import { useUserProfile } from '@/hooks/user/useUserProfile';

const mockedUseUserProfile = vi.mocked(useUserProfile);

describe('risk insights stale state', () => {
  it('derives unique change tags for relevant profile updates only', () => {
    expect(
      getRiskInsightChangeTags(['average_monthly_income', 'occupation', 'gig_platform']),
    ).toEqual(['Income updated', 'Occupation updated', 'Work profile updated']);
    expect(getRiskInsightChangeTags(['phone_number'])).toEqual([]);
  });

  it('keeps stale state session-local and only shows it after relevant updates', async () => {
    const user = userEvent.setup();
    mockedUseUserProfile.mockReturnValue({
      data: fullProfileResponseFixture,
      isPending: false,
      isError: false,
    } as never);

    const { unmount } = render(<ProfilePageController />);

    await user.click(screen.getByRole('button', { name: 'Non relevant update' }));
    await user.click(screen.getByRole('tab', { name: 'Risk Data' }));
    expect(screen.getByText('Stale tags: none')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Personal Information' }));
    await user.click(screen.getByRole('button', { name: 'Relevant update' }));
    await user.click(screen.getByRole('tab', { name: 'Risk Data' }));

    expect(screen.getByText('Stale fields: average_monthly_income, occupation')).toBeInTheDocument();
    expect(screen.getByText('Stale tags: Income updated, Occupation updated')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Update assessment' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );

    unmount();
    render(<ProfilePageController />);
    await user.click(screen.getByRole('tab', { name: 'Risk Data' }));
    expect(screen.getByText('Stale tags: none')).toBeInTheDocument();
  });
});
