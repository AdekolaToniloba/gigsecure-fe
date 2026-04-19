export type InsightBlock =
  | { type: 'section-header'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'callout'; text: string }
  | { type: 'insight-item'; label: string; body: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] };

/**
 * Strips ALL markdown formatting characters (*bold*, _italic_, ##heading)
 * from text but preserves all meaningful content.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')   // bold
    .replace(/\*/g, '')     // italic
    .replace(/^#{1,6}\s+/, '') // headings
    .replace(/__/g, '')     // __bold__
    .replace(/_/g, '')      // _italic_
    .trim();
}

/**
 * True if a raw line (before cleaning) is a bullet list item.
 * Only matches `-` or `•` as bullets, NOT `*` (which is italic markdown).
 */
function getBulletContent(line: string): string | null {
  const match = line.match(/^-\s+(.+)$|^•\s+(.+)$/);
  return match ? (match[1] || match[2]).trim() : null;
}

/**
 * Detects if a raw line is a section header in any of the formats the AI uses:
 * - ### Heading
 * - **HEADING** (bold all-caps)
 * - HEADING (plain all-caps, 5+ chars)
 */
function extractSectionHeader(line: string): string | null {
  // Markdown hash heading
  const hashMatch = line.match(/^#{1,3}\s+(.+)$/);
  if (hashMatch) return stripMarkdown(hashMatch[1]).toUpperCase();

  // Bold all-caps: **YOUR PERSONALIZED PROTECTION PLAN** (with optional trailing spaces/punctuation)
  const boldMatch = line.match(/^\*\*([A-Z][A-Z\s:–\-/&]+?)\*\*\s*$/);
  if (boldMatch) return stripMarkdown(boldMatch[1]).toUpperCase();

  // Plain all-caps paragraph line (no markdown markers)
  if (/^[A-Z][A-Z\s:]{4,}$/.test(line)) return stripMarkdown(line).toUpperCase();

  return null;
}

/**
 * Detects the *Good news – ...* italic callout pattern.
 * Matches lines wrapped in single asterisks: *text* or starting with *
 */
function extractCallout(line: string): string | null {
  // Fully wrapped: *text*
  const wrapped = line.match(/^\*([^*]+)\*$/);
  if (wrapped) return stripMarkdown(wrapped[1]);
  // Starts and ends with single asterisk (AI sometimes omits closing)
  if (line.startsWith('*') && !line.startsWith('**')) {
    return stripMarkdown(line);
  }
  return null;
}

/**
 * Parses a Protection Plan bullet of the form:
 *   - **Cover Name – Priority Level** – Descriptive explanation text here.
 *
 * Returns { coverType, level, description } or null if it doesn't match.
 */
function parseProtectionPlanBullet(rawBulletContent: string): { coverType: string; level: string; description: string } | null {
  const cleaned = stripMarkdown(rawBulletContent);

  // Format: "Cover Name – Level – Description" (en-dash, em-dash, or spaced hyphen)
  // Three-part split: coverType – level – description
  const dashPattern = /^(.+?)(?:\s*(?:–|—| - )\s*)(.+?)(?:\s*(?:–|—| - )\s*)(.+)$/;
  const threePart = cleaned.match(dashPattern);
  if (threePart) {
    return {
      coverType: threePart[1].trim(),
      level: threePart[2].trim(),
      description: threePart[3].trim(),
    };
  }

  // Fallback: two-part split (description resolved by look-ahead in caller)
  const twoPart = cleaned.match(/^(.+?)(?:\s*(?:–|—| - |:)\s*)(.+)$/);
  if (twoPart) {
    return {
      coverType: twoPart[1].trim(),
      level: twoPart[2].trim(),
      description: '',
    };
  }

  return null;
}

export function parseInsights(raw: string): InsightBlock[] {
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  const blocks: InsightBlock[] = [];
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── 1. Section dividers (---, ___, ***) → end current block, signal new section
    if (/^[-_*]{3,}$/.test(line)) {
      // A horizontal rule is a semantic section break; skip but don't discard context
      continue;
    }

    // ── 2. Section Headers (### / **ALL CAPS** / PLAIN ALL CAPS)
    const headerText = extractSectionHeader(line);
    if (headerText) {
      currentSection = headerText;
      blocks.push({ type: 'section-header', text: headerText });
      continue;
    }

    // ── 3. Italic callout lines (*Good news – ...*)
    const calloutText = extractCallout(line);
    if (calloutText) {
      blocks.push({ type: 'callout', text: calloutText });
      continue;
    }

    // ── 4. Standard Markdown tables (| col | col |)
    if (line.startsWith('|') && line.endsWith('|')) {
      const parts = line.split('|').slice(1, -1).map(s => stripMarkdown(s));
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.startsWith('|') && nextLine.includes('---')) {
        const headers = parts;
        i++; // skip separator row
        const rows: string[][] = [];
        while (i + 1 < lines.length && lines[i + 1].startsWith('|') && lines[i + 1].endsWith('|')) {
          i++;
          rows.push(lines[i].split('|').slice(1, -1).map(s => stripMarkdown(s)));
        }
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    // ── 5. Bullet list items
    const bulletContent = getBulletContent(line);
    if (bulletContent) {
      // ── 5a. Protection Plan section → parse as table row
      if (currentSection.includes('PROTECTION PLAN')) {
        const planItem = parseProtectionPlanBullet(bulletContent);
        if (planItem) {
          // If description is empty (fallback two-part match), look ahead
          // for the description text on the very next non-blank, non-bullet line.
          let description = planItem.description;
          if (!description) {
            let offset = 1;
            while (i + offset < lines.length) {
              const nextLine = lines[i + offset];
              // Stop if we hit a bullet, header, new section, or section divider
              if (getBulletContent(nextLine) || extractSectionHeader(nextLine) || extractCallout(nextLine) || /^[-_*]{3,}$/.test(nextLine)) break;
              // Absorb continuation lines (may start with – or be plain text)
              description += (description ? ' ' : '') + stripMarkdown(nextLine);
              offset++;
            }
            i += (offset - 1);
          }

          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock?.type === 'table' && lastBlock.headers[0] === 'Cover Type') {
            lastBlock.rows.push([planItem.coverType, planItem.level, description]);
          } else {
            blocks.push({
              type: 'table',
              headers: ['Cover Type', 'Recommended Level', 'Why it fits you'],
              rows: [[planItem.coverType, planItem.level, description]],
            });
          }
          continue;
        }
      }

      // ── 5b. Labeled insight: "**Label:** body" or "**Label** – body"
      const cleanedBullet = stripMarkdown(bulletContent);
      const labeledMatch = cleanedBullet.match(/^(.+?)\s*[–—:]\s*(.+)$/);
      if (labeledMatch) {
        // Collect any following non-bullet lines as extra body text
        let body = labeledMatch[2].trim();
        let offset = 1;
        while (i + offset < lines.length) {
          const next = lines[i + offset];
          if (getBulletContent(next) || extractSectionHeader(next) || extractCallout(next) || /^[-_*]{3,}$/.test(next)) break;
          body += ' ' + stripMarkdown(next);
          offset++;
        }
        i += (offset - 1);
        blocks.push({ type: 'insight-item', label: labeledMatch[1].trim(), body: body.trim() });
        continue;
      }

      // ── 5c. Plain unlabeled bullet → grouped list
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock?.type === 'list') {
        lastBlock.items.push(cleanedBullet);
      } else {
        blocks.push({ type: 'list', items: [cleanedBullet] });
      }
      continue;
    }

    // ── 6. Plain paragraph
    blocks.push({ type: 'paragraph', text: stripMarkdown(line) });
  }

  return blocks;
}
