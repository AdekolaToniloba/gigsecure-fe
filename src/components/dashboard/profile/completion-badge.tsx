import { ProfileStatus } from './profile-status';

type CompletionBadgeProps = {
  complete: boolean;
};

export function CompletionBadge({ complete }: CompletionBadgeProps) {
  return (
    <ProfileStatus
      label={complete ? 'Summary available' : 'Partial summary'}
      tone={complete ? 'success' : 'warning'}
    />
  );
}
