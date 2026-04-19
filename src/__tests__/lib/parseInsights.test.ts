import { describe, it, expect } from 'vitest';
import { parseInsights } from '@/app/(wizard)/assessment/_lib/parseInsights';

// The exact format from the real API response
const REAL_AI_INSIGHTS = `**PERSONALIZED INSIGHTS**  
Based on what you told us:  

- **Income level and stability:** Your Income Stability Risk sits at **81.8 %**, which means your cash flow is pretty shaky.

- **Your single biggest vulnerability:** The tie‑up between **Income Stability (81.8 %)** and **Client Concentration (81.8 %)** makes the latter the real weak spot.

- **How soon pressure could hit:** If that biggest risk happened tomorrow, you'd likely feel the squeeze within **2‑3 months**.

---

**YOUR PERSONALIZED PROTECTION PLAN**  

- **Health Protection – Recommended** – Your health exposure is moderate (53.8 %); a simple health cover will keep unexpected medical bills from blowing your budget.  

- **Income Protection – Strongly Recommended** – With an 81.8 % risk to income stability, a steady‑pay policy can smooth out those wild cash‑flow swings.  

- **Gadget / Equipment Insurance – Essential for your work** – Your equipment dependency sits at 75 %; a broken laptop or lost gear would cripple your ability to earn.  

- **Emergency Cash Cover – Recommended** – Your financial safety net is 62.5 %; a quick‑access cash buffer will give you breathing room if a client drops out.  

*Good news – affordable premiums for all these covers are already waiting for you on the GigSecure marketplace.*`;

describe('parseInsights — root cause fixes', () => {
  /** ── ROOT CAUSE 1: **BOLD ALL-CAPS** must be a section header ── */
  it('parses **BOLD ALL-CAPS** lines as section-header (not paragraph)', () => {
    const result = parseInsights('**YOUR PERSONALIZED PROTECTION PLAN**');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'section-header',
      text: 'YOUR PERSONALIZED PROTECTION PLAN',
    });
  });

  it('treats --- as a section divider, not content', () => {
    const result = parseInsights('Some text\n---\n**NEW SECTION**');
    const types = result.map((b) => b.type);
    expect(types).not.toContain('paragraph'); // dash should not produce content
    // The NEW SECTION should be a header
    expect(result.find((b) => b.type === 'section-header')).toBeDefined();
  });

  /** ── ROOT CAUSE 2: Protection plan bullets must preserve full descriptive text ── */
  it('parses protection plan bullet with Cover – Level – Description format', () => {
    const input = `**YOUR PERSONALIZED PROTECTION PLAN**

- **Health Protection – Recommended** – Your health exposure is moderate (53.8 %); a simple health cover will keep unexpected medical bills from blowing your budget.`;

    const result = parseInsights(input);
    const table = result.find((b) => b.type === 'table') as any;
    
    expect(table).toBeDefined();
    expect(table.rows[0][0]).toBe('Health Protection');            // Cover Type
    expect(table.rows[0][1]).toBe('Recommended');                  // Level
    expect(table.rows[0][2]).toContain('Your health exposure is moderate'); // Full description
    expect(table.rows[0][2]).toContain('53.8 %');                  // Must NOT be truncated
  });

  it('parses all four protection plan items with full descriptions', () => {
    const input = `**YOUR PERSONALIZED PROTECTION PLAN**

- **Health Protection – Recommended** – Your health exposure is moderate (53.8 %); a simple health cover will keep unexpected medical bills from blowing your budget.

- **Income Protection – Strongly Recommended** – With an 81.8 % risk to income stability, a steady‑pay policy can smooth out those wild cash‑flow swings.

- **Gadget / Equipment Insurance – Essential for your work** – Your equipment dependency sits at 75 %; a broken laptop or lost gear would cripple your ability to earn.

- **Emergency Cash Cover – Recommended** – Your financial safety net is 62.5 %; a quick‑access cash buffer will give you breathing room if a client drops out.`;

    const result = parseInsights(input);
    const table = result.find((b) => b.type === 'table') as any;
    
    expect(table.rows).toHaveLength(4);
    // Each row must have a non-empty description
    table.rows.forEach((row: string[]) => {
      expect(row[2].length).toBeGreaterThan(10); // must have real description text
    });
    // Spot-check "Essential" priority
    const gadgetRow = table.rows.find((r: string[]) => r[0].includes('Gadget'));
    expect(gadgetRow[1]).toBe('Essential for your work');
    expect(gadgetRow[2]).toContain('75 %');
  });

  /** ── ROOT CAUSE 3: *italic* lines must be callout blocks ── */
  it('parses *single-asterisk italic* line as callout, not a list item', () => {
    const result = parseInsights('*Good news – affordable premiums for all these covers are already waiting for you on the GigSecure marketplace.*');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'callout',
      text: 'Good news – affordable premiums for all these covers are already waiting for you on the GigSecure marketplace.',
    });
  });

  it('strips all markdown from callout text', () => {
    const result = parseInsights('*Good news – **affordable premiums** are here.*');
    const callout = result[0] as any;
    expect(callout.type).toBe('callout');
    expect(callout.text).not.toContain('*');
    expect(callout.text).not.toContain('**');
  });

  /** ── FULL INTEGRATION: real API response ── */
  it('correctly parses the real AI insights string end-to-end', () => {
    const result = parseInsights(REAL_AI_INSIGHTS);

    // Section headers
    const headers = result.filter((b) => b.type === 'section-header');
    expect(headers.length).toBeGreaterThanOrEqual(2);
    expect(headers.some((h: any) => h.text.includes('PERSONALIZED INSIGHTS'))).toBe(true);
    expect(headers.some((h: any) => h.text.includes('PROTECTION PLAN'))).toBe(true);

    // Insight items from "Personalized Insights" section  
    const insightItems = result.filter((b) => b.type === 'insight-item');
    expect(insightItems.length).toBeGreaterThanOrEqual(3);

    // Protection plan table
    const table = result.find((b) => b.type === 'table') as any;
    expect(table).toBeDefined();
    expect(table.rows).toHaveLength(4);
    // All descriptions must be non-empty
    table.rows.forEach((row: string[]) => {
      expect(row[2].length).toBeGreaterThan(5);
    });

    // Callout at the end
    const callout = result.find((b) => b.type === 'callout') as any;
    expect(callout).toBeDefined();
    expect(callout.text).toContain('Good news');
    expect(callout.text).not.toContain('*');
  });

  /** ── General helpers ── */
  it('identifies ### Markdown hash headers as section-header', () => {
    const result = parseInsights('### Key Findings');
    expect(result[0]).toMatchObject({ type: 'section-header', text: 'KEY FINDINGS' });
  });

  it('identifies plain ALL CAPS lines as section-header', () => {
    const result = parseInsights('PERSONALIZED INSIGHTS');
    expect(result[0]).toMatchObject({ type: 'section-header', text: 'PERSONALIZED INSIGHTS' });
  });

  it('returns empty array for empty string', () => {
    expect(parseInsights('')).toEqual([]);
  });

  it('strips all bold markers from output', () => {
    const result = parseInsights('**Bold paragraph text.**');
    // Should be treated as paragraph (no bold markers remain)
    expect(result[0].type === 'paragraph' || result[0].type === 'section-header').toBe(true);
    if (result[0].type === 'paragraph') {
      expect((result[0] as any).text).not.toContain('**');
    }
  });

  it('parses standard markdown tables', () => {
    const input = `| Header 1 | Header 2 |\n|----------|-----------|\n| Row 1    | Row 2     |`;
    const result = parseInsights(input);
    expect(result[0]).toMatchObject({
      type: 'table',
      headers: ['Header 1', 'Header 2'],
      rows: [['Row 1', 'Row 2']],
    });
  });
});
