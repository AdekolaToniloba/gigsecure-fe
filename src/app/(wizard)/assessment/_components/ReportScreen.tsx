'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { pdf } from '@react-pdf/renderer';
import type { AssessmentResponse } from '@/types/api';
import { useAuthStore } from '@/store/auth-store';
import { Download, Share2, Check, CreditCard, AlertTriangle, Users, Clock, Heart, Info } from 'lucide-react';
import RiskReportPDF from './report/RiskReportPDF';
import { reportColors } from '@/lib/report-theme';
import { parseInsights } from '../_lib/parseInsights';
import { getRiskLevel } from '../_lib/getRiskLevel';
import { renderInlineBold } from '../_lib/renderInlineBold';

const PILLAR_LABELS: Record<string, string> = {
  income: 'Income Stability',
  client: 'Client Concentration',
  safety: 'Safety Net Strength',
  equipment: 'Equipment Dependency',
  health: 'Health & Lifestyle',
};

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
          <span className="font-body text-xs text-white/70 mt-1">Out of 100%</span>
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
  const [copied, setCopied] = useState(false);

  const parsedInsights = parseInsights(data.ai_insights);

  const handleDownload = async () => {
    const blob = await pdf(<RiskReportPDF data={data} parsedInsights={parsedInsights} firstName={firstName} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gigsecure-risk-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pillarEntries = Object.entries(data.pillar_scores) as [string, number][];
  const criticalGaps = pillarEntries.filter(([_, score]) => score > 70).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-live="polite"
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
          <h2 className="text-white font-heading text-[32px] font-bold leading-tight mb-2">
            {firstName ? `${firstName}, here's your protection plan` : "Here's your protection plan"}
          </h2>
          <p className="text-[#8FB3A8] font-body text-[13px] mb-8">Generated just now</p>

          <div className="flex gap-4 justify-center md:justify-start">
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-12 flex items-center justify-center rounded-lg mb-1 font-bold text-xl"
                style={{ backgroundColor: reportColors.accent, color: reportColors.primary }}
              >
                {data.recommendations.length}
              </div>
              <span className="text-[#8FB3A8] text-xs">Plans Needed</span>
            </div>
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-12 flex items-center justify-center rounded-lg mb-1 font-bold text-xl"
                style={{ backgroundColor: '#2D6053', color: 'white' }}
              >
                {criticalGaps}
              </div>
              <span className="text-[#8FB3A8] text-xs">Critical Gaps</span>
            </div>
          </div>
        </div>
        <CircularGauge
          score={Math.round(data.overall_score)}
          profile={data.risk_profile}
        />
      </div>

      {/* ─── 2. Personalized Insights ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-6 shadow-sm">
        <h3 className="font-heading text-xl font-bold text-slate-900 mb-6">
          Personalized Insights
        </h3>
        
        <div className="flex flex-col gap-4">
          {parsedInsights.map((block, idx) => {
            if (block.type === 'section-header') {
              return (
                <p key={idx} className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4 mb-1">
                  {block.text}
                </p>
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
            return (
              <p key={idx} className="text-[14px] text-slate-600 leading-relaxed">
                {renderInlineBold(block.text)}
              </p>
            );
          })}
        </div>
      </div>

      {/* ─── 3. Recommendations ────────────────────────────────────── */}
      {data.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-8 shadow-sm">
          <h3 className="font-heading text-xl font-bold text-slate-900 mb-6">
            Recommendations
          </h3>
          <ul className="flex flex-col gap-4">
            {data.recommendations.map((rec: string, i: number) => (
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

      {/* ─── 4. Risk Exposure Breakdown ─────────────────────────────── */}
      <div className="mb-8 pl-1">
        <h3 className="font-heading text-xl font-bold text-slate-900 mb-6">
          Risk exposure breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pillarEntries.map(([key, score]) => {
            const risk = getRiskLevel(score);
            const label = PILLAR_LABELS[key] ?? key;
            const barWidth = `${Math.min(score, 100)}%`;
            return (
              <div key={key} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between h-[120px]">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-body text-[13px] font-bold text-slate-800 leading-snug pr-2">{label}</span>
                  <span 
                    className="font-body text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: risk.colors.bg, color: risk.colors.text }}
                  >
                    {risk.label}
                  </span>
                </div>
                <div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: barWidth, backgroundColor: risk.colors.bar }}
                    />
                  </div>
                  <p className="font-body text-[12px] text-slate-400 mt-2">{score}% risk score</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 5. Save / Share ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="text-center md:text-left">
          <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">Save or share your risk summary</h3>
          <p className="font-body text-[14px] text-slate-500">
            Download a PDF of your full profile, or copy a shareable link.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-slate-300 text-slate-700 font-body text-[14px] font-semibold hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-slate-800 text-slate-800 font-body text-[14px] font-semibold hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            <Share2 className="h-4 w-4" />
            {copied ? 'Copied!' : 'Share Link'}
          </button>
        </div>
      </div>

      </div> {/* end of max-w-3xl */}

      {/* ─── 6. Footer ──────────────────────────────────────────── */}
      <footer className="w-full bg-[#004E4C] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-heading text-[22px] font-bold text-white mb-1.5">
              You're among the first freelancers shaping GigSecure
            </h4>
            <p className="font-body text-[15px] text-[#8FB3A8]">
              Be the first to compare prices, activate coverage, and access exclusive launch benefits.
            </p>
          </div>
          <a
            href="/waitlist"
            className="flex items-center justify-center h-12 px-8 rounded-lg bg-[#FFE419] text-[#004E4C] font-body text-[15px] font-bold hover:bg-[#EBD001] transition-colors flex-shrink-0 cursor-pointer"
          >
            Join early access list
          </a>
        </div>
      </footer>
    </motion.div>
  );
}
