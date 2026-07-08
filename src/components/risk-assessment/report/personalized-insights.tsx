import { Check, Info } from 'lucide-react';
import type { InsightBlock } from '@/app/(wizard)/assessment/_lib/parseInsights';
import type { RiskReportDisplayModel } from '@/lib/risk/report-display-model';

type PersonalizedInsightsProps = {
  insights: RiskReportDisplayModel['insights'];
};

function InsightContent({ block, sectionTitle }: { block: InsightBlock; sectionTitle: string }) {
  if (block.type === 'list') {
    return (
      <ul className="space-y-3">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex min-w-0 items-start gap-3 text-sm leading-6 text-slate-600">
            <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary-light" />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'insight-item') {
    return (
      <div className="min-w-0 rounded-xl bg-app-canvas p-4 sm:p-5">
        <h4 className="break-words text-sm font-bold text-slate-800 [overflow-wrap:anywhere]">
          {block.label}
        </h4>
        <p className="mt-1 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
          {block.body}
        </p>
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div
        role="region"
        aria-label={`${sectionTitle} details`}
        tabIndex={0}
        className="max-w-full overflow-x-auto rounded-xl border border-app-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <table className="min-w-[36rem] text-left text-sm text-slate-600">
          <caption className="sr-only">{sectionTitle} details</caption>
          <thead className="bg-app-canvas text-slate-800">
            <tr>
              {block.headers.map((header, index) => (
                <th key={`${header}-${index}`} scope="col" className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border bg-white">
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="break-words px-4 py-3 align-top [overflow-wrap:anywhere]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === 'callout') {
    return (
      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-primary/15 bg-primary-muted p-4">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0 break-words text-sm leading-6 text-primary [overflow-wrap:anywhere]">
          {block.text}
        </p>
      </div>
    );
  }

  if (block.type === 'paragraph') {
    return <p className="break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{block.text}</p>;
  }

  return null;
}

export function PersonalizedInsights({ insights }: PersonalizedInsightsProps) {
  return (
    <section
      aria-labelledby="personalized-insights-title"
      className="min-w-0 rounded-2xl border border-app-border bg-white p-6 shadow-sm sm:p-8"
    >
      <p className="text-sm font-semibold text-primary-light">Based on your assessment</p>
      <h3 id="personalized-insights-title" className="mt-2 font-heading text-2xl font-bold text-primary">
        Personalized insights
      </h3>

      {insights.sections.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-slate-600">
          No personalized insights were provided for this assessment.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {insights.sections.map((section, sectionIndex) => (
            <section key={`${section.title}-${sectionIndex}`} className="min-w-0">
              {section.title.toLocaleLowerCase() === 'personalized insights' ? null : (
                <h4 className="break-words font-heading text-lg font-bold text-slate-800 [overflow-wrap:anywhere]">
                  {section.title}
                </h4>
              )}
              <div className={section.title.toLocaleLowerCase() === 'personalized insights' ? 'space-y-4' : 'mt-4 space-y-4'}>
                {section.blocks.map((block, blockIndex) => (
                  <InsightContent
                    key={`${block.type}-${blockIndex}`}
                    block={block}
                    sectionTitle={section.title}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
