'use client';

import { ProfileErrorState } from '@/components/dashboard/profile/profile-error-state';

export default function DashboardProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl min-w-0">
      <h1 className="font-heading text-3xl font-bold text-primary">Profile</h1>
      <p className="mt-2 text-sm leading-6 text-primary-light sm:text-base">
        Manage your personal details, security and preferences
      </p>
      <div className="mt-7">
        <ProfileErrorState
          title="Profile unavailable"
          message="Something unexpected interrupted your profile page. Please try again."
          actionLabel="Reload profile"
          onRetry={reset}
        />
      </div>
    </section>
  );
}
