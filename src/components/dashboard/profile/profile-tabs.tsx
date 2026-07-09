'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ProfileTabId } from '@/types/profile';

type TabConfig = {
  id: ProfileTabId;
  label: string;
  content: React.ReactNode;
};

type ProfileTabsProps = {
  tabs: readonly TabConfig[];
  activeTab: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
};

export function ProfileTabs({ tabs, activeTab, onChange }: ProfileTabsProps) {
  const tabRefs = useRef<Record<ProfileTabId, HTMLButtonElement | null>>({
    'personal-information': null,
    'risk-data': null,
    security: null,
  });
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);

  function focusTab(index: number) {
    const tab = tabs[index];
    if (!tab) return;
    onChange(tab.id);
    tabRefs.current[tab.id]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTab(currentIndex === tabs.length - 1 ? 0 : currentIndex + 1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTab(currentIndex === 0 ? tabs.length - 1 : currentIndex - 1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusTab(tabs.length - 1);
    }
  }

  return (
    <div className="min-w-0">
      <div className="border-b border-app-border">
        <div
          role="tablist"
          aria-label="Profile sections"
          className="-mb-px flex min-w-0 gap-6 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                id={`${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onChange(tab.id)}
                onKeyDown={handleKeyDown}
                className={cn(
                  'min-h-12 shrink-0 border-b-[3px] px-1 pb-3 pt-1 text-left text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  isActive
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

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <section
            key={tab.id}
            id={`${tab.id}-panel`}
            role="tabpanel"
            aria-labelledby={`${tab.id}-tab`}
            hidden={!isActive}
            tabIndex={0}
            className="min-w-0 pt-6 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isActive ? tab.content : null}
          </section>
        );
      })}
    </div>
  );
}
