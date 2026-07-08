'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardCheck,
  LayoutDashboard,
  ReceiptText,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AvailableNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  available: true;
};

type UnavailableNavigationItem = {
  label: string;
  icon: LucideIcon;
  available: false;
};

export type AppNavigationItem = AvailableNavigationItem | UnavailableNavigationItem;

export const APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    available: true,
  },
  {
    label: 'Risk Assessment',
    href: '/dashboard/risk-assessment',
    icon: ClipboardCheck,
    available: true,
  },
  {
    label: 'Premiums Bought',
    icon: ReceiptText,
    available: false,
  },
  {
    label: 'Profile',
    icon: UserRound,
    available: false,
  },
  {
    label: 'Settings',
    icon: Settings,
    available: false,
  },
] as const;

type AppNavigationProps = {
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ onNavigate }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="App navigation" className="w-full">
      <ul className="space-y-4" role="list">
        {APP_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;

          if (!item.available) {
            return (
              <li key={item.label}>
                <div
                  aria-disabled="true"
                  className="flex min-h-16 w-full min-w-0 items-center gap-5 px-12 py-3 text-primary/55"
                >
                  <Icon aria-hidden="true" className="h-6 w-6 shrink-0" strokeWidth={1.8} />
                  <span className="min-w-0 flex-1 text-base font-medium">{item.label}</span>
                  <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wide text-primary/65">
                    Soon
                  </span>
                </div>
              </li>
            );
          }

          const isActive = isActivePath(pathname, item.href);

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onNavigate}
                className={cn(
                  'relative flex min-h-16 w-full min-w-0 touch-manipulation items-center gap-5 px-12 py-3 text-base font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-sidebar',
                  isActive
                    ? 'bg-primary text-white before:absolute before:inset-y-0 before:left-0 before:w-[7px] before:bg-accent'
                    : 'text-primary hover:bg-white/70'
                )}
              >
                <Icon aria-hidden="true" className="h-6 w-6 shrink-0" strokeWidth={1.8} />
                <span className="min-w-0">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
