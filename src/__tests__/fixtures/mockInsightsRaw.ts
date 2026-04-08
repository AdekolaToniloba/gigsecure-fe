/** Standard happy-path AI insights output */
export const INSIGHTS_STANDARD = `PERSONALIZED INSIGHTS

- **Income Vulnerability:** Your income stability is moderate, but losing your biggest client could impact over 50% of your revenue.
- **Equipment Dependency:** You are very dependent on your equipment. A single hardware failure could halt your work for days.

RISK FACTORS

- **Financial Pressure** – With limited savings, you may struggle to cover 3 months of expenses.
- **Health Consideration:** Your overall health rating suggests room for improvement.

Based on your profile, we recommend prioritizing income protection.`;

/** Em-dash variant (AI sometimes produces these) */
export const INSIGHTS_EM_DASH = `KEY FINDINGS

- **Work Risk** – Your work involves significant equipment dependency.
- **Client Risk** – Heavy reliance on a single client sector.`;

/** Edge case: extra whitespace, empty lines */
export const INSIGHTS_EXTRA_WHITESPACE = `  PERSONALIZED INSIGHTS  

   - **Income Stability:**   Your income is fairly stable across multiple sources.   

   Some paragraph text that is not a bullet point.  

`;

/** Edge case: empty string */
export const INSIGHTS_EMPTY = '';

/** Edge case: no section headers, just bullets */
export const INSIGHTS_NO_HEADERS = `- **Finding One:** This is the first finding.
- **Finding Two:** This is the second finding.`;
