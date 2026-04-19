import { Document, Page, Text, View, StyleSheet, Svg, Circle, Path } from '@react-pdf/renderer';
import type { AssessmentResponse } from '@/types/api';
import type { InsightBlock } from '../../_lib/parseInsights';
import { reportColors } from '@/lib/report-theme';

const PILLAR_LABELS: Record<string, string> = {
  income: 'Income Stability',
  client: 'Client Concentration',
  safety: 'Safety Net Strength',
  equipment: 'Equipment Dependency',
  health: 'Health & Lifestyle',
};

function getRiskLevel(score: number) {
  if (score > 70) return { label: 'High Risk', colors: reportColors.risk.high };
  if (score >= 40) return { label: 'Moderate', colors: reportColors.risk.moderate };
  return { label: 'Low Risk', colors: reportColors.risk.low };
}

function getPdfInsightIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('income') || l.includes('stability')) {
    return (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M3 10h18M7 15h.01M7 11h.01M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (l.includes('vulnerability') || l.includes('equipment')) {
    return (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 17h.01" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (l.includes('common') || l.includes('freelancer')) {
    return (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="9" cy="7" r="4" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (l.includes('pressure') || l.includes('time') || l.includes('days')) {
    return (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 6v6l4 2" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (l.includes('health')) {
    return (
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16v-4" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8h.01" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: reportColors.white },
  
  // Hero block
  hero: { 
    backgroundColor: reportColors.secondary, 
    padding: 30, 
    borderRadius: 16, 
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroLeft: { flex: 1, paddingRight: 20 },
  heroPre: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: reportColors.white, marginBottom: 8, lineHeight: 1.2 },
  heroDate: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  
  // PDF Gauge
  gaugeContainer: { alignItems: 'center', justifyContent: 'center', width: 100, height: 120 },
  gaugeScoreCont: { position: 'absolute', top: 35, left: 0, right: 0, alignItems: 'center' },
  gaugeScore: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  gaugeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  riskProfile: { fontSize: 12, fontWeight: 'bold', color: reportColors.accent, marginTop: 10, textAlign: 'center' },

  // Sections
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: reportColors.text.dark, marginBottom: 12 },
  
  // Insights
  insightHeader: { fontSize: 10, color: reportColors.text.light, textTransform: 'uppercase', marginTop: 16, marginBottom: 6, letterSpacing: 1 },
  insightPara: { fontSize: 11, color: reportColors.text.body, lineHeight: 1.6, marginBottom: 8 },
  insightItemRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  insightIconBox: { width: 16, height: 16, borderRadius: 4, backgroundColor: reportColors.primary + '1A', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  insightItemCol: { flex: 1 },
  insightLabel: { fontSize: 11, fontWeight: 'bold', color: reportColors.text.dark, marginBottom: 2 },
  insightBody: { fontSize: 11, color: reportColors.text.body, lineHeight: 1.5 },
  
  // Recommendations
  recRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6 },
  recBullet: { width: 14, height: 14, marginRight: 10, marginTop: 1 },
  recText: { fontSize: 11, color: reportColors.text.body, lineHeight: 1.5, flex: 1 },

  // Tables
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCellHeader: {
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: reportColors.text.dark,
  },
  tableCell: {
    fontSize: 10,
    color: reportColors.text.body,
    lineHeight: 1.4,
  },

  // Breakdown grid (2 cols)
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  pillarCard: { 
    width: '48%', 
    backgroundColor: reportColors.white, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12 
  },
  pillarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pillarName: { fontSize: 10, fontWeight: 'bold', color: reportColors.text.body },
  pillarBadge: { fontSize: 8, fontWeight: 'bold', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 10 },
  barTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  scoreText: { fontSize: 9, color: reportColors.text.light, marginTop: 6 },
  
  // Footer
  footer: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20, alignItems: 'center' },
  footerText: { fontSize: 10, color: reportColors.text.light }
});

export default function RiskReportPDF({ 
  data, 
  parsedInsights, 
  firstName 
}: { 
  data: AssessmentResponse; 
  parsedInsights: InsightBlock[];
  firstName: string | null;
}) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const filled = (data.overall_score / 100) * circumference;

  return (
    <Document>
      <Page size={[800, 1100]} style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroPre}>Your Personalized Protection Plan</Text>
            <Text style={styles.heroTitle}>
              {firstName ? `${firstName}, here's your protection plan` : "Here's your protection plan"}
            </Text>
            <Text style={styles.heroDate}>{`Generated ${new Date().toLocaleDateString()}`}</Text>
          </View>
          
          <View style={styles.gaugeContainer}>
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r={String(radius)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <Circle 
                cx="50" cy="50" r={String(radius)} 
                fill="none" 
                stroke={reportColors.accent} 
                strokeWidth="8" 
                strokeDasharray={`${filled} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={styles.gaugeScoreCont}>
              <Text style={styles.gaugeScore}>{`${Math.round(data.overall_score)}%`}</Text>
            </View>
            <Text style={styles.riskProfile}>{data.risk_profile}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk exposure breakdown</Text>
          <View style={styles.grid}>
            {(Object.entries(data.pillar_scores) as [string, number][]).map(([key, score]) => {
              const risk = getRiskLevel(score);
              return (
                <View key={key} style={styles.pillarCard}>
                  <View style={styles.pillarHeader}>
                    <Text style={styles.pillarName}>{PILLAR_LABELS[key] ?? key}</Text>
                    <Text style={[styles.pillarBadge, { backgroundColor: risk.colors.bg, color: risk.colors.text }]}>
                      {risk.label}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(score, 100)}%`, backgroundColor: risk.colors.bar }]} />
                  </View>
                  <Text style={styles.scoreText}>{`${score}% risk score`}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalized Insights</Text>
          {parsedInsights.map((block, idx) => {
            if (block.type === 'section-header') {
              return <Text key={idx} style={styles.insightHeader}>{block.text.replace(/\*/g, '')}</Text>;
            }
            if (block.type === 'insight-item') {
              return (
                <View key={idx} style={styles.insightItemRow}>
                  <View style={styles.insightIconBox}>
                    {getPdfInsightIcon(block.label)}
                  </View>
                  <View style={styles.insightItemCol}>
                    <Text style={styles.insightLabel}>{block.label.replace(/\*/g, '')}</Text>
                    <Text style={styles.insightBody}>{block.body.replace(/\*/g, '')}</Text>
                  </View>
                </View>
              );
            }
            if (block.type === 'table') {
              return (
                <View key={idx} style={styles.tableContainer}>
                  <View style={styles.tableHeaderRow}>
                    {block.headers.map((h, i) => (
                      <View key={i} style={{ flex: i === 2 ? 3 : 2 }}>
                        <Text style={styles.tableCellHeader}>{h}</Text>
                      </View>
                    ))}
                  </View>
                  {block.rows.map((row, i) => (
                    <View key={i} style={[styles.tableRow, i === block.rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                      {row.map((cell, j) => {
                        const isRecommended = j === 1 && (cell.toLowerCase().includes('recommended') || cell.toLowerCase().includes('essential'));
                        return (
                        <View key={j} style={{ flex: j === 2 ? 3 : 2, padding: 8 }}>
                          {isRecommended ? (
                            <View style={{ backgroundColor: cell.toLowerCase().includes('essential') ? '#FFEDD5' : '#CCFBF1', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' }}>
                              <Text style={{ fontSize: 9, fontWeight: 'bold', color: cell.toLowerCase().includes('essential') ? '#C2410C' : '#0F766E' }}>{cell.replace(/\*/g, '')}</Text>
                            </View>
                          ) : (
                            <Text style={[styles.tableCell, j === 0 ? { fontWeight: 'bold', color: reportColors.text.dark } : {}]}>{cell.replace(/\*/g, '')}</Text>
                          )}
                        </View>
                      )})}
                    </View>
                  ))}
                </View>
              );
            }
            return <Text key={idx} style={styles.insightPara}>{block.text.replace(/\*/g, '')}</Text>;
          })}
        </View>

        {data.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {data.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recRow}>
                <View style={styles.recBullet}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text style={styles.recText}>{rec.replace(/\*/g, '')}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by GigSecure · gigsecure.co</Text>
        </View>
      </Page>
    </Document>
  );
}
