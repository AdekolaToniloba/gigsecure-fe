'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AssessmentResponse } from '@/types/api';
import { useAuthStore } from '@/store/auth-store';
import { Check, CreditCard, AlertTriangle, Users, Clock, Heart, Info } from 'lucide-react';
import { reportColors } from '@/lib/report-theme';
import { createRiskReportDisplayModel } from '@/lib/risk/report-display-model';
import { ReportActions } from '@/components/risk-assessment/report/report-actions';
import { getRiskScorePresentation } from '../_lib/getRiskLevel';
import { renderInlineBold } from '../_lib/renderInlineBold';
import { twMerge } from 'tailwind-merge';

function getInsightIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('income') || l.includes('stability')) return <CreditCard className="w-5 h-5 text-teal-600" />;
  if (l.includes('vulnerability') || l.includes('equipment')) return <AlertTriangle className="w-5 h-5 text-orange-600" />;
  if (l.includes('common') || l.includes('freelancer')) return <Users className="w-5 h-5 text-blue-600" />;
  if (l.includes('pressure') || l.includes('time') || l.includes('days')) return <Clock className="w-5 h-5 text-yellow-600" />;
  if (l.includes('health')) return <Heart className="w-5 h-5 text-red-600" />;
  return <Info className="w-5 h-5 text-slate-500" />;
}

function CircularGauge({ score, profile }: { score: number; profile: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-36 w-36">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#2D6053" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={reportColors.accent}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-[32px] font-bold text-white leading-none">{score}%</span>
        </div>
      </div>
      <span
        className="mt-2 font-body text-sm font-semibold"
        style={{ color: reportColors.accent }}
      >
        {profile}
      </span>
    </div>
  );
}

interface Props {
  data: AssessmentResponse;
}

export default function ReportScreen({ data }: Props) {
  const firstName = useAuthStore((s) => s.firstName);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();
  const report = createRiskReportDisplayModel(data);
  const displayFirstName = firstName ?? report.applicant.firstName;
  const downloadReport = displayFirstName === report.applicant.firstName
    ? report
    : {
        ...report,
        applicant: {
          ...report.applicant,
          firstName: displayFirstName ?? '',
          fullName: [displayFirstName, report.applicant.lastName].filter(Boolean).join(' '),
        },
      };

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4 }}
      role="region"
      aria-labelledby="public-risk-report-title"
      className="w-full pt-4 pb-0"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-0">
      {/* ─── 1. Hero card ───────────────────────────────────────────── */}
      <div 
        className="rounded-2xl p-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-8"
        style={{ backgroundColor: reportColors.secondary }}
      >
        <div className="flex-1 w-full text-center md:text-left">
          <p className="text-[#8FB3A8] font-body text-xs mb-2">Your Personalized Protection Plan</p>
          <h2
            ref={headingRef}
            id="public-risk-report-title"
            tabIndex={-1}
            className="text-white font-heading text-[32px] font-bold leading-tight mb-2 outline-none"
          >
            {displayFirstName ? `${displayFirstName}, here's your protection plan` : "Here's your protection plan"}
          </h2>
        </div>
        <CircularGauge
          score={report.score.rounded}
          profile={report.riskProfile}
        />
      </div>

      {/* ─── 4. Risk Exposure Breakdown (Reordered) ─────────────────────────────── */}
      <div className="mb-10 pl-1">
        <h3 className="font-heading text-xl font-bold text-slate-900 mb-6">
          Risk exposure breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {report.exposures.map((exposure) => {
            const risk = getRiskScorePresentation(exposure.score);
            const barWidth = `${exposure.score}%`;
            return (
              <motion.div 
                whileHover={reduceMotion ? undefined : { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
                key={exposure.key}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-[130px] transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-body text-[14px] font-bold text-slate-800 leading-snug pr-2">{exposure.label}</span>
                  <span 
                    className="font-body text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: risk.colors.bg, color: risk.colors.text }}
                  >
                    {risk.label}
                  </span>
                </div>
                <div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: barWidth, backgroundColor: risk.colors.bar }}
                    />
                  </div>
                  <p className="font-body text-[12px] text-slate-500 font-medium">{exposure.roundedScore}% risk score</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Insight Sections (Grouped by Header) ─────────────────── */}
      <div className="flex flex-col gap-6 mb-6">
        {report.insights.sections.map((section, sIdx) => (
            <div key={sIdx} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <h3 className="font-heading text-xl font-bold text-slate-900 mb-6 capitalize leading-snug">
                {section.title}
              </h3>
              
              <div className="flex flex-col gap-4">
                {section.blocks.map((block, idx) => {
                  if (block.type === 'list') {
                    return (
                      <div key={idx} className="flex flex-col gap-3 py-1">
                        {block.items.map((item: string, i: number) => (
                          <div key={i} className="flex gap-4 items-start rounded-xl">
                            <div className="flex-shrink-0 mt-1 h-5 w-5 rounded-full bg-teal-50 flex items-center justify-center">
                              <Check className="h-3 w-3 text-teal-600" />
                            </div>
                            <p className="text-[14px] text-slate-600 leading-relaxed">
                              {renderInlineBold(item)}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (block.type === 'insight-item') {
                    return (
                      <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl">
                        <div className="flex-shrink-0 mt-0.5">
                          {getInsightIcon(block.label)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-[15px] mb-1">
                            {renderInlineBold(block.label)}
                          </span>
                          <p className="text-[14px] text-slate-600 leading-relaxed">
                            {renderInlineBold(block.body)}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (block.type === 'table') {
                    return (
                      <div key={idx} className="overflow-hidden overflow-x-auto rounded-xl border border-slate-200 mt-2 mb-2 shadow-sm">
                        <table className="w-full text-left text-sm text-slate-600 bg-white min-w-[600px]">
                          <thead className="bg-slate-50/80 text-slate-900 border-b border-slate-200">
                            <tr>
                              {block.headers.map((h: string, i: number) => (
                                <th key={i} className="px-5 py-3.5 font-bold font-heading whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {block.rows.map((row: string[], i: number) => {
                              const isRecommendedRow = row[1]?.toLowerCase().includes('recommended') || row[1]?.toLowerCase().includes('essential');
                              return (
                                <tr key={i} className={twMerge(
                                  "transition-colors",
                                  isRecommendedRow ? "bg-teal-50/20 hover:bg-teal-50/30" : "hover:bg-slate-50"
                                )}>
                                  {row.map((cell, j) => {
                                    const isRecommended = j === 1 && (cell.toLowerCase().includes('recommended') || cell.toLowerCase().includes('essential'));
                                    return (
                                    <td key={j} className="px-5 py-4 align-top">
                                      {isRecommended ? (
                                        <span className={twMerge(
                                          "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border",
                                          cell.toLowerCase().includes('essential') 
                                            ? 'bg-orange-100 text-orange-700 border-orange-200' 
                                            : 'bg-white text-teal-700 border-teal-200 shadow-sm'
                                        )}>
                                          {renderInlineBold(cell)}
                                        </span>
                                      ) : j === 0 ? (
                                        <span className="font-semibold text-slate-800 break-words block">{renderInlineBold(cell)}</span>
                                      ) : (
                                        <span className="leading-relaxed block text-[#475569]">{renderInlineBold(cell)}</span>
                                      )}
                                    </td>
                                  )})}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (block.type === 'callout') {
                    return (
                      <div key={idx} className="mt-2 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3">
                        <Info className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[13px] text-teal-800 leading-relaxed font-medium">
                          {block.text}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-[14px] text-slate-600 leading-relaxed">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* ─── 3. Recommendations ────────────────────────────────────── */}
      {report.advice.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-8 shadow-sm">
          <h3 className="font-heading text-xl font-bold text-slate-900 mb-6">
            Recommendations
          </h3>
          <ul className="flex flex-col gap-4">
            {report.advice.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                  <Check className="h-[14px] w-[14px] text-teal-600" strokeWidth={3} />
                </div>
                <span className="font-body text-[15px] text-slate-700 pt-0.5">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      </div> {/* end of max-w-3xl */}

      {/* ─── 6. Footer ──────────────────────────────────────────── */}
      <footer className="w-full bg-[#004E4C] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-heading text-[22px] font-bold text-white mb-1.5">
              You&apos;re among the first freelancers shaping GigSecure
            </h4>
            <p className="font-body text-[15px] text-[#8FB3A8]">
              Be the first to compare prices, activate coverage, and access exclusive launch benefits.
            </p>
          </div>
          <ReportActions report={downloadReport} tone="accent" />
        </div>
      </footer>
    </motion.div>
  );
}
