import { UserRound } from 'lucide-react';
import { formatUserName, getProfileFallbackText } from './profile-formatters';
import type { ProfileResponse } from '@/types/profile';

type UserSummaryHeaderProps = {
  profileResponse: ProfileResponse;
};

export function UserSummaryHeader({ profileResponse }: UserSummaryHeaderProps) {
  const { user, profile } = profileResponse;
  const fullName = formatUserName(user.first_name, user.last_name);
  const occupation = getProfileFallbackText(profile?.occupation);
  const initials = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((part) => part?.[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <aside className="flex min-w-0 items-center gap-4 rounded-2xl border border-app-border bg-white p-4 shadow-sm sm:max-w-sm">
      {profile?.profile_picture_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.profile_picture_url}
          alt={`${fullName} profile`}
          className="h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-sidebar text-primary">
          {initials ? (
            <span className="font-heading text-lg font-bold">{initials}</span>
          ) : (
            <UserRound aria-hidden="true" className="h-6 w-6" />
          )}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-heading text-lg font-bold text-primary">{fullName}</p>
        <p className="mt-1 text-sm text-primary-light [overflow-wrap:anywhere]">{occupation}</p>
      </div>
    </aside>
  );
}
