export type InsightBlock =
  | { type: 'section-header'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'insight-item'; label: string; body: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

export function parseInsights(raw: string): InsightBlock[] {
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  const blocks: InsightBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ALL CAPS section headers
    if (/^[A-Z][A-Z\s:]+$/.test(line) && line.length > 4) {
      blocks.push({ type: 'section-header', text: line });
      continue;
    }

    // Bullet items
    const itemMatch =
      line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)/) ||
      line.match(/^-\s+\*\*(.+?)\*\*\s*[–:-]\s*(.+)/);
    if (itemMatch) {
      blocks.push({ type: 'insight-item', label: itemMatch[1], body: itemMatch[2] });
      continue;
    }

    // Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      const parts = line.split('|').slice(1, -1).map(s => s.trim());
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.startsWith('|') && nextLine.includes('---')) {
        const headers = parts;
        i++; // skip separator
        const rows: string[][] = [];
        while (i + 1 < lines.length && lines[i + 1].startsWith('|') && lines[i + 1].endsWith('|')) {
          i++;
          const rowLine = lines[i];
          rows.push(rowLine.split('|').slice(1, -1).map(s => s.trim()));
        }
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    // Remaining lines — treat as paragraph
    blocks.push({ type: 'paragraph', text: line });
  }

  return blocks;
}
