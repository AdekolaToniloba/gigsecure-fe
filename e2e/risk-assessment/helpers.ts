import { expect, type BrowserContext, type Page, type Route } from '@playwright/test';

export const E2E_BASE_URL =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`;

export const WAITLIST_ACCESS_TOKEN = 'waitlist-risk-access-token';
export const DASHBOARD_ACCESS_TOKEN = 'dashboard-risk-e2e-token';

export const riskCategories = ['tech_freelancer'];

export const riskQuestions = {
  category: 'tech_freelancer',
  title: 'Risk Assessment for Independent Technology Professionals',
  description:
    'Tell us how your work, income, equipment, health, and financial safety net affect your ability to keep earning.',
  steps: [
    {
      step: 1,
      title: 'You & your work',
      subtitle: 'Tell us about your freelance role',
      questions: [
        {
          id: 'job_type',
          text: 'What type of tech freelancing do you do?',
          type: 'single_choice',
          options: ['Web Development', 'Mobile Development', 'Data Science', 'DevOps', 'UI/UX Design'],
        },
        {
          id: 'freelance_duration',
          text: 'How long have you been freelancing?',
          type: 'single_choice',
          options: ['Less than 1 year', '1-3 years', '3-5 years', '5+ years'],
        },
        {
          id: 'client_geography',
          text: 'Where are most of your clients based?',
          type: 'single_choice',
          options: ['Nigeria only', 'Africa', 'Global', 'Mixed'],
        },
        {
          id: 'work_mode',
          text: 'What is your primary work mode?',
          type: 'single_choice',
          options: ['Fully remote', 'Hybrid', 'On-site', 'Varies by project'],
        },
        {
          id: 'weekly_hours',
          text: 'How many hours do you work per week?',
          type: 'single_choice',
          options: ['Less than 20', '20-40', '40-60', '60+'],
        },
      ],
    },
    {
      step: 2,
      title: 'Income & stability',
      subtitle: 'Your earnings and financial stability',
      questions: [
        {
          id: 'monthly_income_band',
          text: 'What is your average monthly income?',
          type: 'single_choice',
          options: ['Under ₦100k', '₦100k-₦500k', '₦500k-₦1M', 'Over ₦1M'],
        },
        {
          id: 'income_stability',
          text: 'How stable is your income?',
          type: 'single_choice',
          options: ['Very stable', 'Somewhat stable', 'Unstable', 'Very unstable'],
        },
        {
          id: 'income_sources',
          text: 'How many income sources do you have?',
          type: 'single_choice',
          options: ['1', '2-3', '4-5', '6+'],
        },
        {
          id: 'biggest_client_loss',
          text: 'What percentage of income would you lose if your biggest client left?',
          type: 'single_choice',
          options: ['Less than 25%', '25-50%', '50-75%', 'More than 75%'],
        },
      ],
    },
    {
      step: 3,
      title: 'Your risks',
      subtitle: 'Identify your key risk areas',
      questions: [
        {
          id: 'past_risks',
          text: 'Which risks have you experienced?',
          type: 'multi_choice',
          options: ['Late payments', 'Client disputes', 'Equipment failure', 'Health issues', 'Data loss'],
        },
        {
          id: 'top_worries',
          text: 'Rank your top concerns (select up to 3)',
          type: 'ranking',
          max_selections: 3,
          options: ['Income loss', 'Health emergency', 'Equipment damage', 'Legal issues', 'Burnout'],
        },
        {
          id: 'equipment_dependency',
          text: 'How dependent are you on your equipment?',
          type: 'single_choice',
          options: ['Not at all', 'Somewhat', 'Very dependent', 'Completely dependent'],
        },
      ],
    },
    {
      step: 4,
      title: 'Health & lifestyle',
      subtitle: 'Your health information helps us assess your wellbeing risk',
      consent_required: true,
      consent_text: 'I agree to provide basic health information for insurance assessment purposes.',
      questions: [
        {
          id: 'pre_existing_conditions',
          text: 'Do you have any pre-existing conditions?',
          type: 'boolean',
        },
        {
          id: 'chronic_illness',
          text: 'Do you have any chronic illnesses?',
          type: 'boolean',
        },
        {
          id: 'smoker',
          text: 'Are you a smoker?',
          type: 'boolean',
        },
        {
          id: 'health_rating',
          text: 'Rate your overall health',
          type: 'rating',
          min: 1,
          max: 5,
          labels: { '1': 'Poor', '2': 'Fair', '3': 'Average', '4': 'Good', '5': 'Excellent' },
        },
        {
          id: 'travel_frequency',
          text: 'How often do you travel for work?',
          type: 'single_choice',
          options: ['Never', 'Rarely', 'Monthly', 'Weekly'],
        },
      ],
    },
    {
      step: 5,
      title: 'Safety net & history',
      subtitle: 'Your existing coverage and financial safety net',
      questions: [
        {
          id: 'survival_3_months',
          text: 'Could you survive 3 months without income?',
          type: 'single_choice',
          options: ['Yes, comfortably', 'Yes, but tight', 'No', 'Definitely not'],
        },
        {
          id: 'savings_duration',
          text: 'How many months of expenses do you have saved?',
          type: 'single_choice',
          options: ['None', '1-2 months', '3-6 months', '6+ months'],
        },
        {
          id: 'insurance_types',
          text: 'What insurance do you currently have?',
          type: 'multi_choice',
          options: ['Health insurance', 'Life insurance', 'Equipment insurance', 'Professional liability', 'None'],
        },
        {
          id: 'insurance_claims',
          text: 'Have you made insurance claims before?',
          type: 'single_choice',
          options: ['Never', 'Once', 'Multiple times'],
        },
        {
          id: 'protection_priority',
          text: 'What is your top protection priority?',
          type: 'single_choice',
          options: ['Income protection', 'Health coverage', 'Equipment protection', 'Legal protection'],
        },
      ],
    },
  ],
} as const;

export const publicAssessmentResponse = {
  applicant: {
    first_name: 'Oluwakanyinsola',
    last_name: 'Adebayo-Akinyemi',
    age: 31,
    gender: 'female',
    marital_status: 'single',
    state: 'Lagos',
    city: 'Ikeja',
  },
  category: 'tech_freelancer',
  pillar_scores: {
    income: 72,
    client: 45,
    safety: 80,
    equipment: 35,
    health: 55,
  },
  overall_score: 68.5,
  risk_profile: 'Moderate Risk',
  recommendations: [
    'Build an emergency reserve that can cover at least three months of essential expenses.',
    'Consider income protection suited to irregular freelance earnings and client-payment delays.',
  ],
  recommended_categories: ['Income Protection', 'Equipment Protection'],
  ai_insights:
    'Your income is moderately stable, but a long client payment delay or loss of essential equipment could interrupt your ability to earn.',
} as const;

export const dashboardAssessmentResponse = {
  ...publicAssessmentResponse,
  applicant: {
    first_name: 'Amaka',
    last_name: 'Obi',
    age: 31,
    gender: 'female',
    marital_status: 'single',
    state: 'Lagos',
    city: 'Ikeja',
  },
  ai_insights:
    'Your project-based income remains moderately stable. The strongest next step is to reduce equipment dependency while building a larger emergency reserve.',
} as const;

export const updatedDashboardAssessmentResponse = {
  ...dashboardAssessmentResponse,
  applicant: {
    ...dashboardAssessmentResponse.applicant,
    first_name: 'Updated',
  },
  overall_score: 42,
  risk_profile: 'Updated Risk Profile',
  ai_insights:
    'Your updated answers show a steadier safety net, but client concentration still needs attention.',
} as const;

export const dashboardProducts = [
  productFixture({
    id: 'prod-income',
    name: 'Income Shield for Gig Workers',
    category: 'Income Protection',
    providerSlug: 'axa-mansard',
    providerName: 'AXA Mansard',
    premium: '9500',
    coverage: '130000',
    riskLevel: 'low',
  }),
  productFixture({
    id: 'prod-equipment',
    name: 'Equipment Protection Plus',
    category: 'Equipment Protection',
    providerSlug: 'leadway',
    providerName: 'Leadway Assurance',
    premium: '6200',
    coverage: '250000',
    riskLevel: 'moderate',
  }),
  productFixture({
    id: 'prod-health',
    name: 'Flexible Health Support',
    category: 'Health Protection',
    providerSlug: 'zurich',
    providerName: 'Zurich Nigeria',
    premium: '4300',
    coverage: '90000',
    riskLevel: 'low',
  }),
] as const;

export function dashboardProfile(flags: { kycVerified: boolean; riskAssessed: boolean }) {
  return {
    user: {
      id: '00000000-0000-4000-8000-000000000042',
      email: 'amara@example.com',
      first_name: 'Amara',
      last_name: 'Okafor',
      status: 'active',
      role: 'user',
      email_verified: true,
      phone_number: null,
      last_login_at: null,
      created_at: '2026-07-08T08:00:00Z',
    },
    profile: {
      date_of_birth: '1994-04-12',
      gender: 'female',
      state: 'Lagos',
      city: 'Ikeja',
      occupation: 'tech_freelancer',
    },
    kyc_verified: flags.kycVerified,
    risk_assessed: flags.riskAssessed,
  };
}

export async function mockAnonymousRefresh(page: Page) {
  await page.unroute('**/api/auth/refresh').catch(() => undefined);
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, { detail: 'No refresh token' }, 401),
  );
}

export async function seedRefreshCookie(
  context: BrowserContext,
  value = 'risk-refresh-token',
) {
  await context.addCookies([
    {
      name: 'gs_refresh_token',
      value,
      url: E2E_BASE_URL,
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
}

export async function mockRefresh(
  page: Page,
  flags: { kycVerified: boolean; riskAssessed: boolean },
  accessToken = DASHBOARD_ACCESS_TOKEN,
) {
  await page.unroute('**/api/auth/refresh').catch(() => undefined);
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, {
      access_token: accessToken,
      token_type: 'bearer',
      kyc_verified: flags.kycVerified,
      risk_assessed: flags.riskAssessed,
    }),
  );
}

export async function fulfillJson(
  route: Route,
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  if (route.request().method() === 'OPTIONS') {
    const origin = route.request().headers().origin ?? new URL(route.request().url()).origin;
    await route.fulfill({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with',
        Vary: 'Origin',
      },
    });
    return;
  }

  const origin = route.request().headers().origin ?? new URL(route.request().url()).origin;
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      Vary: 'Origin',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export async function completeAssessmentWizard(
  page: Page,
  options: { useDashboardPrefill?: boolean } = {},
) {
  await expect(page.getByRole('heading', { name: "Let's get to know you" })).toBeVisible();

  if (!options.useDashboardPrefill) {
    await page.locator('#first_name').fill('Oluwakanyinsola');
    await page.locator('#last_name').fill('Adebayo-Akinyemi');
    await selectDate(page, '15', 'June', '1995');
    await selectOption(page, '#gender', 'Female');
    await selectComboboxOption(page, '#state', 'Lagos', 'Lagos');
    await selectOption(page, '#city', 'Ikeja');
    await selectOption(page, '#occupation', 'tech_freelancer');
  }

  await selectOption(page, '#marital_status', 'Single');
  await page.getByRole('button', { name: /^Next/ }).click();

  await chooseRadio(page, 'What type of tech freelancing do you do?', 'Web Development');
  await chooseRadio(page, 'How long have you been freelancing?', '3-5 years');
  await chooseRadio(page, 'Where are most of your clients based?', 'Global');
  await chooseRadio(page, 'What is your primary work mode?', 'Fully remote');
  await chooseRadio(page, 'How many hours do you work per week?', '20-40');
  await page.getByRole('button', { name: /^Next/ }).click();

  await chooseRadio(page, 'What is your average monthly income?', '₦100k-₦500k');
  await chooseRadio(page, 'How stable is your income?', 'Somewhat stable');
  await chooseRadio(page, 'How many income sources do you have?', '2-3');
  await chooseRadio(page, 'What percentage of income would you lose if your biggest client left?', '25-50%');
  await page.getByRole('button', { name: /^Next/ }).click();

  await chooseCheckbox(page, 'Which risks have you experienced?', 'Late payments');
  await page.getByRole('button', { name: 'Add Income loss to ranking' }).click();
  await page.getByRole('button', { name: 'Add Equipment damage to ranking' }).click();
  await chooseRadio(page, 'How dependent are you on your equipment?', 'Completely dependent');
  await page.getByRole('button', { name: /^Next/ }).click();

  await page.locator('label[for="health-consent"]').click();
  await page.getByRole('button', { name: 'Continue to health questions' }).click();

  await chooseBoolean(page, 'Do you have any pre-existing conditions?', 'No');
  await chooseBoolean(page, 'Do you have any chronic illnesses?', 'No');
  await chooseBoolean(page, 'Are you a smoker?', 'No');
  await page
    .getByRole('radiogroup', { name: 'Rate your overall health' })
    .getByRole('radio', { name: /^4\b/ })
    .click();
  await chooseRadio(page, 'How often do you travel for work?', 'Rarely');
  await page.getByRole('button', { name: /^Next/ }).click();

  await chooseRadio(page, 'Could you survive 3 months without income?', 'Yes, but tight');
  await chooseRadio(page, 'How many months of expenses do you have saved?', '1-2 months');
  await chooseCheckbox(page, 'What insurance do you currently have?', 'None');
  await chooseRadio(page, 'Have you made insurance claims before?', 'Never');
  await chooseRadio(page, 'What is your top protection priority?', 'Income protection');
  await page.getByRole('button', { name: /submit assessment/i }).click();
}

export async function expectNoHorizontalOverflow(page: Page, widths: number[]) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
  }
}

async function selectDate(page: Page, day: string, month: string, year: string) {
  await page.locator('#date_of_birth').click();
  await page.getByRole('combobox', { name: 'Choose the Year' }).selectOption(year);
  await page.getByRole('combobox', { name: 'Choose the Month' }).selectOption({ label: month });
  await page
    .getByRole('button', { name: new RegExp(`${month} ${day}(st|nd|rd|th), ${year}$`) })
    .click();
}

async function selectOption(page: Page, triggerSelector: string, option: string) {
  await page.locator(triggerSelector).click();
  await page.getByRole('button', { name: option, exact: true }).click();
}

async function selectComboboxOption(
  page: Page,
  triggerSelector: string,
  query: string,
  option: string,
) {
  const trigger = page.locator(triggerSelector);
  await trigger.click();
  const triggerId = (await trigger.getAttribute('id')) ?? '';
  await page.locator(`#${triggerId}-search`).fill(query);
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function chooseRadio(page: Page, question: string, option: string) {
  await page
    .getByRole('radiogroup', { name: question, exact: true })
    .getByRole('radio', { name: option, exact: true })
    .click();
}

async function chooseCheckbox(page: Page, question: string, option: string) {
  await page
    .getByRole('group', { name: question, exact: true })
    .getByRole('checkbox', { name: option, exact: true })
    .click();
}

async function chooseBoolean(page: Page, question: string, option: 'Yes' | 'No') {
  await page
    .getByRole('radiogroup', { name: question, exact: true })
    .getByRole('radio', { name: option, exact: true })
    .click();
}

function productFixture({
  id,
  name,
  category,
  providerSlug,
  providerName,
  premium,
  coverage,
  riskLevel,
}: {
  id: string;
  name: string;
  category: string;
  providerSlug: string;
  providerName: string;
  premium: string;
  coverage: string;
  riskLevel: string;
}) {
  return {
    id,
    name,
    category,
    description: `${category} that provides financial support when unexpected events interrupt your work.`,
    premium_amount: premium,
    premium_currency: 'NGN',
    coverage_amount: coverage,
    renewal_frequency: 'monthly',
    risk_level: riskLevel,
    is_active: true,
    provider: {
      id: `provider-${providerSlug}`,
      slug: providerSlug,
      name: providerName,
      logo_url: null,
    },
  };
}
