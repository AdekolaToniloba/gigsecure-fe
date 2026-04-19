export type InsightBlock =
  | { type: 'section-header'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'insight-item'; label: string; body: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

export function parseInsights(raw: string): InsightBlock[] {
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  const blocks: InsightBlock[] = [];
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignore horizontal rules that bleed through markdown
    if (/^[-_*]{3,}$/.test(line)) {
      continue;
    }

    // Headers (either ALL CAPS or starting with ###)
    const hashMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (hashMatch) {
      currentSection = hashMatch[1].toUpperCase();
      blocks.push({ type: 'section-header', text: hashMatch[1].toUpperCase() });
      continue;
    }
    if (/^[A-Z][A-Z\s:]+$/.test(line) && line.length > 4) {
      currentSection = line;
      blocks.push({ type: 'section-header', text: line });
      continue;
    }

    // Regular Bullet items
    const itemMatch =
      line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)/) ||
      line.match(/^-\s+\*\*(.+?)\*\*\s*[–:-]\s*(.+)/);
    if (itemMatch) {
      blocks.push({ type: 'insight-item', label: itemMatch[1], body: itemMatch[2] });
      continue;
    }

    // Protection Plan List Items -> Map to Table
    if (currentSection.includes('PROTECTION PLAN') && line.startsWith('-')) {
      const planItemMatch = line.match(/^-\s+\*{0,2}(.*?)\*{0,2}\s*[–-]\s*\*{0,2}(.*?)\*{0,2}$/);
      if (planItemMatch) {
        const coverType = planItemMatch[1].trim();
        const recommendedLevel = planItemMatch[2].trim();

        let reason = '';
        let offset = 1;
        while (i + offset < lines.length) {
          const nextLine = lines[i + offset];
          if (nextLine.startsWith('-') || nextLine.startsWith('|') || /^[A-Z][A-Z\s:]+$/.test(nextLine) || /^[-_*]{3,}$/.test(nextLine)) {
            break;
          }
          reason += (reason ? ' ' : '') + nextLine;
          offset++;
        }
        i += (offset - 1); // consume the description lines

        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock?.type === 'table' && lastBlock.headers[0] === 'Cover Type') {
          lastBlock.rows.push([coverType, recommendedLevel, reason]);
        } else {
          blocks.push({
            type: 'table',
            headers: ['Cover Type', 'Recommended Level', 'Why it fits you'],
            rows: [[coverType, recommendedLevel, reason]]
          });
        }
        continue;
      }
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
