import Link from 'next/link';

export function RiskAssessmentPrompt() {
  return (
    <aside
      aria-labelledby="risk-assessment-prompt-title"
      className="rounded-xl border border-primary/15 bg-white p-5 text-center"
    >
      <h2 id="risk-assessment-prompt-title" className="font-heading text-sm font-bold text-primary">
        Need Help Choosing
      </h2>
      <p className="mt-4 text-xs leading-5 text-primary-light">
        Take the Risk assessment to get the best recommendations.
      </p>
      <Link
        href="/assessment"
        className="mt-16 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Take Risk Assessment <span aria-hidden="true" className="ml-3">→</span>
      </Link>
    </aside>
  );
}
