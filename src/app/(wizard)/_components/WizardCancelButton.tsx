'use client';

import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';

export default function WizardCancelButton() {
  const router = useRouter();
  const reset = useWizardStore((s) => s.reset);

  const handleCancel = () => {
    reset();
    router.push('/');
  };

  return (
    <button
      type="button"
      onClick={handleCancel}
      className="text-white font-body text-[16px] font-medium hover:text-white/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] rounded-sm px-2 py-1"
      aria-label="Cancel and return to home"
    >
      Cancel
    </button>
  );
}
