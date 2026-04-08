export type InsightBlock =
  | { type: 'section-header'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'insight-item'; label: string; body: string };

export function parseInsights(raw: string): InsightBlock[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // ALL CAPS section headers (e.g. "PERSONALIZED INSIGHTS", allowing some punctuation like colons)
      if (/^[A-Z][A-Z\s:]+$/.test(line) && line.length > 4) {
        return { type: 'section-header', text: line } as const;
      }
      // Bullet items: "- **Label:** body" (colon inside bold) or "- **Label** – body" (separator outside)
      const itemMatch =
        line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)/) ||        // colon inside: - **Label:** body
        line.match(/^-\s+\*\*(.+?)\*\*\s*[–:-]\s*(.+)/);   // colon/dash outside: - **Label** – body
      if (itemMatch) {
        return { type: 'insight-item', label: itemMatch[1], body: itemMatch[2] } as const;
      }
      // Remaining lines — treat as paragraph (bold tags stripped during render)
      return { type: 'paragraph', text: line } as const;
    });
}
