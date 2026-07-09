import Link from 'next/link';

export function RiskDataEditNote() {
  return (
    <div className="rounded-2xl border border-primary/15 bg-app-sidebar px-5 py-4 text-sm text-primary">
      Updating your risk data currently uses the full assessment flow. Section-level editing and draft saves are not supported by the current backend contract.
      {' '}
      <Link
        href="/dashboard/risk-assessment"
        className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Open the full assessment
      </Link>
      .
    </div>
  );
}
