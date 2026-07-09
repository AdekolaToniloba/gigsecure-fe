'use client';

import { useState } from 'react';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { parseApiError } from '@/lib/api/errors';
import { ASSESSMENT_RELEVANT_PROFILE_FIELDS } from '@/types/profile';
import { PROFILE_TAB_IDS, type ProfileTabId } from '@/types/profile';
import type { ProfileEditableField } from '@/lib/validators/user';
import { getRiskInsightChangeTags } from './risk-insights-stale';
import { PersonalInformationSection } from './personal-information-section';
import { ProfileErrorState } from './profile-error-state';
import { ProfileSkeleton } from './profile-skeleton';
import { ProfileTabs } from './profile-tabs';
import { RiskDataSection } from './risk-data-section';
import { SecuritySection } from './security-section';
import { UserSummaryHeader } from './user-summary-header';

export function ProfilePageController() {
  const [activeTab, setActiveTab] = useState<ProfileTabId>(PROFILE_TAB_IDS[0]);
  const [staleFields, setStaleFields] = useState<ProfileEditableField[]>([]);
  const profileQuery = useUserProfile();

  if (profileQuery.isPending || !profileQuery.data) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError) {
    return (
      <ProfileErrorState
        message={parseApiError(profileQuery.error).message}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const staleTags = getRiskInsightChangeTags(staleFields);

  return (
    <section className="mx-auto w-full max-w-7xl min-w-0">
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold text-primary">Profile</h1>
          <p className="mt-2 text-sm leading-6 text-primary-light sm:text-base">
            Manage your personal details, security and preferences
          </p>
        </div>
        <UserSummaryHeader profileResponse={profileQuery.data} />
      </div>

      <div className="mt-8">
        <ProfileTabs
          tabs={[
            {
              id: 'personal-information',
              label: 'Personal Information',
              content: (
                <PersonalInformationSection
                  profileResponse={profileQuery.data}
                  onAssessmentRelevantUpdate={(fields) => {
                    const relevantFields = fields.filter((field) =>
                      ASSESSMENT_RELEVANT_PROFILE_FIELDS.includes(
                        field as (typeof ASSESSMENT_RELEVANT_PROFILE_FIELDS)[number],
                      ),
                    );
                    if (relevantFields.length === 0) return;
                    setStaleFields((current) => Array.from(new Set([...current, ...relevantFields])));
                  }}
                />
              ),
            },
            {
              id: 'risk-data',
              label: 'Risk Data',
              content: (
                <RiskDataSection
                  profileResponse={profileQuery.data}
                  staleFields={staleFields}
                  staleTags={staleTags}
                />
              ),
            },
            {
              id: 'security',
              label: 'Security',
              content: <SecuritySection />,
            },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>
    </section>
  );
}
