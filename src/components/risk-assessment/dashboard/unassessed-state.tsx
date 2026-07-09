'use client';

import Image from 'next/image';
import { Info } from 'lucide-react';
import type { Ref } from 'react';
import Button from '@/components/ui/Button';

type UnassessedStateProps = {
  onStart: () => void;
  startButtonRef?: Ref<HTMLButtonElement>;
};

export function UnassessedState({ onStart, startButtonRef }: UnassessedStateProps) {
  return (
    <section
      aria-labelledby="unassessed-risk-title"
      className="min-w-0 overflow-hidden rounded-2xl border border-[#C7DEDA] bg-[#EEF8F6] px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
    >
      <div className="mx-auto flex max-w-4xl min-w-0 flex-col items-center text-center">
        <Image
          src="/assets/images/risk-assessment-empty.webp"
          alt=""
          aria-hidden="true"
          width={720}
          height={480}
          sizes="(max-width: 640px) 88vw, 360px"
          className="h-auto w-full max-w-[22.5rem] rounded-2xl object-contain"
          priority
        />

        <div className="mt-7 min-w-0 max-w-2xl">
          <h2
            id="unassessed-risk-title"
            className="font-heading text-xl font-bold leading-tight text-primary sm:text-2xl"
          >
            Discover your risk profile
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Answer a few questions about your work, income, health, and financial safety net to
            understand where you may need more protection.
          </p>
        </div>

        <Button
          ref={startButtonRef}
          type="button"
          size="lg"
          onClick={onStart}
          className="mt-7 min-h-12 w-full px-8 sm:w-auto"
        >
          Take assessment
        </Button>
        <p className="mt-3 text-sm text-slate-500">Takes about 5 minutes</p>

        <div
          role="note"
          className="mt-8 flex w-full min-w-0 items-start gap-3 rounded-xl border border-[#C7DEDA] bg-white/80 p-4 text-left text-sm leading-6 text-slate-600 sm:px-5"
        >
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="min-w-0">
            Your answers are used to generate your personal risk assessment and protection
            recommendations.
          </p>
        </div>
      </div>
    </section>
  );
}
