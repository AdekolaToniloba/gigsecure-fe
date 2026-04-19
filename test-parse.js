const raw = `
---

YOUR PERSONALIZED PROTECTION PLAN

- Health Protection – Strongly Recommended

Your Health Exposure Risk is 69.2 %, so a sudden illness could wipe out weeks of earnings.

- Income Protection – Recommended

With an Income Stability Risk of 63.6 %, a short-term income buffer will smooth out the gaps between gigs.
`;

const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
const blocks = [];
let currentSection = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (/^[-_*]{3,}$/.test(line)) {
    continue;
  }

  if (/^[A-Z][A-Z\s:]+$/.test(line) && line.length > 4) {
    currentSection = line;
    blocks.push({ type: 'section-header', text: line });
    continue;
  }

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
      i += (offset - 1);

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

  blocks.push({ type: 'paragraph', text: line });
}

console.log(JSON.stringify(blocks, null, 2));
