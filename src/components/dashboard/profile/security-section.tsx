'use client';

import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { ProfileStatus } from './profile-status';
import { SecurityRow } from './security-row';
import { ChangePasswordModal } from './change-password-modal';
import { KycStatusRow } from './kyc-status-row';

export function SecuritySection() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  return (
    <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6">
      <div aria-live="polite" role="status" className="mb-4 text-sm text-emerald-700">
        {statusMessage}
      </div>

      <SecurityRow
        icon={KeyRound}
        label="Password"
        helperText="Keep your account password up to date."
        status={<ProfileStatus label="Protected" />}
        action={{
          kind: 'button',
          label: 'Change',
          onClick: () => {
            setStatusMessage('');
            setIsPasswordModalOpen(true);
          },
        }}
      />

      <KycStatusRow />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => setStatusMessage('Your password was updated successfully.')}
      />
    </section>
  );
}
