'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { parseApiError } from '@/lib/api/errors';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import {
  useDeactivateAccount,
  useDeleteAccount,
  useNotificationSettings,
  usePrivacySettings,
  useUpdateNotificationSetting,
  useUpdatePrivacySetting,
} from '@/hooks/settings/useSettings';
import { cn } from '@/lib/utils';
import type {
  NotificationPreferenceKey,
  NotificationPrefsResponse,
  PrivacySettingKey,
  PrivacySettingsResponse,
} from '@/types/settings';

type SettingsTab = 'notifications' | 'privacy' | 'delete';
type AccountAction = 'deactivate' | 'delete';

type TabConfig = {
  id: SettingsTab;
  label: string;
};

const SETTINGS_TABS: readonly TabConfig[] = [
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy and Data' },
  { id: 'delete', label: 'Delete account' },
] as const;

const NOTIFICATION_ROWS: Array<{
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: 'risk_score_updates',
    label: 'Risk score updates',
    description: 'Get an email when your financial risk score changes.',
  },
  {
    key: 'premium_renewals',
    label: 'Premium renewals',
    description: 'Receive reminders before an active premium is due for renewal.',
  },
  {
    key: 'new_plan_recommendations',
    label: 'New plan recommendations',
    description: 'Hear about protection plans that match your risk profile.',
  },
  {
    key: 'payment_confirmations',
    label: 'Payment confirmations',
    description: 'Receive email receipts after successful payments.',
  },
  {
    key: 'product_updates',
    label: 'GigSecure product updates',
    description: 'Stay informed about product improvements and platform updates.',
  },
];

const PRIVACY_ROWS: Array<{
  key: PrivacySettingKey;
  label: string;
  description: string;
}> = [
  {
    key: 'share_anonymised_data',
    label: 'Share anonymised data for risk research',
    description: 'Help improve risk models using data that does not identify you.',
  },
  {
    key: 'personalise_recommendations',
    label: 'Allow GigSecure to personalise recommendations',
    description: 'Use your profile and risk history to improve plan suggestions.',
  },
  {
    key: 'share_data_with_partners',
    label: 'Share data with insurance partners',
    description: 'Allow sharing required details for live premium quotes. You can turn this off anytime.',
  },
];

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function SettingsPageController() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [statusMessage, setStatusMessage] = useState('');
  const [accountAction, setAccountAction] = useState<AccountAction | null>(null);
  const tabRefs = useRef<Record<SettingsTab, HTMLButtonElement | null>>({
    notifications: null,
    privacy: null,
    delete: null,
  });

  const notificationQuery = useNotificationSettings({ enabled: activeTab === 'notifications' });
  const privacyQuery = usePrivacySettings({ enabled: activeTab === 'privacy' });
  const updateNotification = useUpdateNotificationSetting();
  const updatePrivacy = useUpdatePrivacySetting();
  const deactivateAccount = useDeactivateAccount();
  const deleteAccount = useDeleteAccount();

  const notificationError = updateNotification.error ? parseApiError(updateNotification.error) : null;
  const privacyError = updatePrivacy.error ? parseApiError(updatePrivacy.error) : null;

  const activeTabIndex = SETTINGS_TABS.findIndex((tab) => tab.id === activeTab);

  function selectTab(tab: SettingsTab, focus = false) {
    setActiveTab(tab);
    setStatusMessage('');
    if (focus) {
      tabRefs.current[tab]?.focus();
    }
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const lastIndex = SETTINGS_TABS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = activeTabIndex === lastIndex ? 0 : activeTabIndex + 1;
    if (event.key === 'ArrowLeft') nextIndex = activeTabIndex === 0 ? lastIndex : activeTabIndex - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;
    if (nextIndex === null) return;

    event.preventDefault();
    selectTab(SETTINGS_TABS[nextIndex].id, true);
  }

  async function cleanupSessionAndRedirect(reason: AccountAction) {
    const target = `/login?account=${reason === 'delete' ? 'deleted' : 'deactivated'}`;
    try {
      await authService.logout();
    } catch {
      // The account action may have invalidated the backend session already.
    } finally {
      router.replace(target);
      window.setTimeout(clearAuth, 100);
    }
  }

  async function handleAccountConfirm(password?: string) {
    if (accountAction === 'deactivate') {
      await deactivateAccount.mutateAsync();
      setStatusMessage('Your account has been deactivated.');
      await cleanupSessionAndRedirect('deactivate');
      return;
    }

    if (accountAction === 'delete') {
      await deleteAccount.mutateAsync({ password: password ?? '' });
      setStatusMessage('Your account has been deleted.');
      await cleanupSessionAndRedirect('delete');
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="min-w-0 border-b border-app-border">
        <div
          role="tablist"
          aria-label="Settings sections"
          className="-mb-px flex min-w-0 gap-8 overflow-x-auto"
        >
          {SETTINGS_TABS.map((tab) => {
            const isSelected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                id={`${tab.id}-settings-tab`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`${tab.id}-settings-panel`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={handleTabKeyDown}
                className={cn(
                  'min-h-12 shrink-0 border-b-[3px] px-1 pb-3 pt-1 text-left text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-primary',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {statusMessage}
      </div>

      {activeTab === 'notifications' ? (
        <section
          id="notifications-settings-panel"
          role="tabpanel"
          aria-labelledby="notifications-settings-tab"
          tabIndex={0}
          className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <PreferencePanel
            title="Email notifications"
            description="Control which emails GigSecure sends to you."
            queryState={{
              isLoading: notificationQuery.isLoading,
              isError: notificationQuery.isError,
              error: notificationQuery.error,
              refetch: notificationQuery.refetch,
            }}
          >
            {notificationError ? (
              <InlineError message={notificationError.message} />
            ) : null}
            <PreferenceList
              rows={NOTIFICATION_ROWS}
              values={notificationQuery.data}
              pendingKey={updateNotification.isPending ? updateNotification.variables?.key : null}
              onToggle={async (key, value, label) => {
                await updateNotification.mutateAsync({ key, value });
                setStatusMessage(`${label} ${value ? 'enabled' : 'disabled'}.`);
              }}
            />
          </PreferencePanel>
        </section>
      ) : null}

      {activeTab === 'privacy' ? (
        <section
          id="privacy-settings-panel"
          role="tabpanel"
          aria-labelledby="privacy-settings-tab"
          tabIndex={0}
          className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <PreferencePanel
            title="Data & privacy controls"
            description="Control how GigSecure uses and stores your information."
            queryState={{
              isLoading: privacyQuery.isLoading,
              isError: privacyQuery.isError,
              error: privacyQuery.error,
              refetch: privacyQuery.refetch,
            }}
            subheading="Data usage"
          >
            {privacyError ? <InlineError message={privacyError.message} /> : null}
            <PreferenceList
              rows={PRIVACY_ROWS}
              values={privacyQuery.data}
              pendingKey={updatePrivacy.isPending ? updatePrivacy.variables?.key : null}
              onToggle={async (key, value, label) => {
                await updatePrivacy.mutateAsync({ key, value });
                setStatusMessage(`${label} ${value ? 'enabled' : 'disabled'}.`);
              }}
            />
          </PreferencePanel>
        </section>
      ) : null}

      {activeTab === 'delete' ? (
        <section
          id="delete-settings-panel"
          role="tabpanel"
          aria-labelledby="delete-settings-tab"
          tabIndex={0}
          className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <DangerZone
            onDeactivate={() => {
              deactivateAccount.reset();
              deleteAccount.reset();
              setAccountAction('deactivate');
            }}
            onDelete={() => {
              deactivateAccount.reset();
              deleteAccount.reset();
              setAccountAction('delete');
            }}
          />
        </section>
      ) : null}

      <AccountActionModal
        key={accountAction ?? 'closed'}
        action={accountAction}
        isOpen={accountAction !== null}
        isPending={deactivateAccount.isPending || deleteAccount.isPending}
        apiError={
          deactivateAccount.error || deleteAccount.error
            ? parseApiError(deactivateAccount.error ?? deleteAccount.error).message
            : null
        }
        onClose={() => {
          if (!deactivateAccount.isPending && !deleteAccount.isPending) {
            deactivateAccount.reset();
            deleteAccount.reset();
            setAccountAction(null);
          }
        }}
        onConfirm={handleAccountConfirm}
      />
    </div>
  );
}

function PreferencePanel({
  title,
  description,
  subheading,
  queryState,
  children,
}: {
  title: string;
  description: string;
  subheading?: string;
  queryState: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
  };
  children: React.ReactNode;
}) {
  if (queryState.isLoading) {
    return (
      <section aria-labelledby="settings-loading-title" className="min-w-0">
        <h1 id="settings-loading-title" className="font-heading text-2xl font-bold text-primary">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div
          role="status"
          aria-label={`Loading ${title}`}
          className="mt-8 space-y-5 motion-reduce:[&_*]:animate-none"
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex min-h-20 items-center justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-4 w-52 max-w-full animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-80 max-w-full animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-8 w-14 shrink-0 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (queryState.isError) {
    const parsed = parseApiError(queryState.error);
    return (
      <section role="alert" aria-live="assertive" className="max-w-3xl">
        <div className="flex min-w-0 flex-col rounded-lg border border-red-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-bold text-primary">{title} unavailable</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{parsed.message}</p>
            </div>
          </div>
          <Button type="button" onClick={queryState.refetch} className="mt-5 w-fit">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${title.replace(/\W+/g, '-').toLowerCase()}-title`} className="min-w-0">
      <h1
        id={`${title.replace(/\W+/g, '-').toLowerCase()}-title`}
        className="font-heading text-2xl font-bold text-primary sm:text-3xl"
      >
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      {subheading ? (
        <h2 className="mt-10 font-heading text-lg font-bold text-primary">{subheading}</h2>
      ) : null}
      <div className={cn('min-w-0', subheading ? 'mt-3' : 'mt-8')}>{children}</div>
    </section>
  );
}

function PreferenceList<T extends NotificationPrefsResponse | PrivacySettingsResponse>({
  rows,
  values,
  pendingKey,
  onToggle,
}: {
  rows: Array<{
    key: keyof T & string;
    label: string;
    description: string;
  }>;
  values?: T;
  pendingKey: string | null | undefined;
  onToggle: (key: keyof T & string, value: boolean, label: string) => Promise<void>;
}) {
  if (!values) return null;

  return (
    <div className="divide-y divide-app-border">
      {rows.map((row) => {
        const checked = Boolean(values[row.key]);
        const isPending = pendingKey === row.key;
        return (
          <PreferenceRow
            key={row.key}
            label={row.label}
            description={row.description}
            checked={checked}
            isPending={isPending}
            onToggle={() => onToggle(row.key, !checked, row.label)}
          />
        );
      })}
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  isPending,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  isPending: boolean;
  onToggle: () => Promise<void>;
}) {
  const descriptionId = useMemo(
    () => `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-description`,
    [label],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 py-5 sm:min-h-20 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        <h3 className="text-base font-semibold text-slate-950">{label}</h3>
        <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={descriptionId}
        disabled={isPending}
        onClick={() => {
          void onToggle().catch(() => undefined);
        }}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 touch-manipulation items-center rounded-full border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-wait disabled:opacity-70',
          checked ? 'border-primary bg-primary' : 'border-slate-300 bg-slate-200',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex h-6 w-6 translate-x-1 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-transform',
            checked && 'translate-x-7',
          )}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        </span>
      </button>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 flex max-w-3xl items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function DangerZone({
  onDeactivate,
  onDelete,
}: {
  onDeactivate: () => void;
  onDelete: () => void;
}) {
  return (
    <section aria-labelledby="danger-zone-title" className="max-w-5xl">
      <h1 id="danger-zone-title" className="font-heading text-2xl font-bold text-red-700 sm:text-3xl">
        Danger zone
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        These actions are permanent or sensitive. Please read each option carefully before continuing.
      </p>

      <div className="mt-8 divide-y divide-red-100 border-y border-red-100">
        <DangerActionRow
          title="Deactivate account"
          description="Temporarily disable your account. You can reactivate it by logging back in."
          buttonLabel="Deactivate"
          buttonClassName="border border-red-300 bg-white text-red-700 hover:bg-red-50"
          onClick={onDeactivate}
        />
        <DangerActionRow
          title="Delete my account"
          description="Permanently delete your account, data, risk history, and coverage records."
          buttonLabel="Delete account"
          buttonClassName="bg-red-700 text-white hover:bg-red-800"
          onClick={onDelete}
        />
      </div>
    </section>
  );
}

function DangerActionRow({
  title,
  description,
  buttonLabel,
  buttonClassName,
  onClick,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  buttonClassName: string;
  onClick: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 sm:w-auto',
          buttonClassName,
        )}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function AccountActionModal({
  action,
  isOpen,
  isPending,
  apiError,
  onClose,
  onConfirm,
}: {
  action: AccountAction | null;
  isOpen: boolean;
  isPending: boolean;
  apiError: string | null;
  onClose: () => void;
  onConfirm: (password?: string) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const copy = action === 'delete'
    ? {
      title: 'Delete account?',
      description:
        'This permanently deletes your account, data, risk history, and coverage records. This cannot be undone.',
      confirm: 'Delete account',
    }
    : {
      title: 'Deactivate account?',
      description:
        'This temporarily disables your account. You can reactivate it later by logging back in.',
      confirm: 'Deactivate',
    };

  const close = useCallback(() => {
    if (!isPending) onClose();
  }, [isPending, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [close, isOpen]);

  if (!isOpen || !action) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action === 'delete' && password.trim().length === 0) {
      setPasswordError('Enter your password to delete your account.');
      return;
    }

    setPasswordError('');
    try {
      await onConfirm(action === 'delete' ? password : undefined);
    } catch {
      // Mutation state owns the user-facing error.
    }
  }

  function handleBackdropMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) close();
  }

  const passwordDescription = [
    'delete-password-help',
    passwordError ? 'delete-password-error' : null,
  ].filter(Boolean).join(' ');

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 px-4 py-6"
      onMouseDown={handleBackdropMouseDown}
      data-testid="settings-account-modal-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-account-modal-title"
        aria-describedby="settings-account-modal-description"
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl outline-none sm:p-7"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          disabled={isPending}
          aria-label="Close account confirmation dialog"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-700">
          <AlertTriangle aria-hidden="true" className="h-6 w-6" />
        </div>

        <form onSubmit={submit} noValidate>
          <div className="pr-8">
            <h2 id="settings-account-modal-title" className="font-heading text-2xl font-bold text-slate-950">
              {copy.title}
            </h2>
            <p id="settings-account-modal-description" className="mt-3 text-sm leading-6 text-slate-600">
              {copy.description}
            </p>
          </div>

          {action === 'delete' ? (
            <div className="mt-5">
              <label htmlFor="delete-account-password" className="text-sm font-semibold text-slate-900">
                Password
              </label>
              <p id="delete-password-help" className="mt-1 text-sm leading-6 text-slate-600">
                Confirm your password to permanently delete your account.
              </p>
              <input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError('');
                }}
                disabled={isPending}
                aria-invalid={passwordError ? 'true' : undefined}
                aria-describedby={passwordDescription}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              {passwordError ? (
                <p id="delete-password-error" className="mt-2 text-sm text-red-700">
                  {passwordError}
                </p>
              ) : null}
            </div>
          ) : null}

          {apiError ? (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {apiError}
            </div>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            >
              {isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Processing' : copy.confirm}
            </button>
          </div>

          <span role="status" aria-live="polite" className="sr-only">
            {isPending ? `${copy.confirm} in progress` : ''}
          </span>
        </form>
      </div>
    </div>
  );
}
