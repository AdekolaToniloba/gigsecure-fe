import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';
import WizardCancelButton from './_components/WizardCancelButton';
import { assetUrl, ASSETS } from '@/lib/assets';

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Wizard Header ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#004E4C] h-16 flex items-center justify-between px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] rounded-sm"
          aria-label={`${APP_NAME} home`}
        >
          <Image
            src={assetUrl(ASSETS.logo)}
            alt={APP_NAME}
            width={140}
            height={36}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>

        <WizardCancelButton />
      </header>

      {/* ─── Content ────────────────────────────────────────────────── */}
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
