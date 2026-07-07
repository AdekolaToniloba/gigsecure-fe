import { AppSkipLink } from '@/components/dashboard/shell/app-skip-link';

export const APP_MAIN_ID = 'dashboard-content';

type AuthenticatedAppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
};

export function AuthenticatedAppShell({
  children,
  sidebar,
  header,
}: AuthenticatedAppShellProps) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-app-canvas text-slate-900">
      <AppSkipLink targetId={APP_MAIN_ID} />

      <div className="grid min-h-dvh min-w-0 lg:grid-cols-[18.625rem_minmax(0,1fr)]">
        <aside
          aria-label="Application sidebar"
          className="hidden border-r border-app-border bg-app-sidebar lg:sticky lg:top-0 lg:flex lg:h-dvh lg:min-w-0 lg:flex-col"
        >
          {sidebar}
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-col">
          <header
            aria-label="Application header"
            className="flex min-h-18 min-w-0 items-center border-b border-app-border bg-white px-4 sm:px-6 lg:h-[6.25rem] lg:px-8"
          >
            {header}
          </header>

          <main
            id={APP_MAIN_ID}
            tabIndex={-1}
            aria-label="Application content"
            className="min-w-0 flex-1 px-4 py-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
