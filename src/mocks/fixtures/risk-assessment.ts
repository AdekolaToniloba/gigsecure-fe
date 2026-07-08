import type {
  AssessmentResponse,
  AssessmentSummary,
  RecommendationsResponse,
  TechAssessmentInput,
  WaitlistSignupResponse,
} from '@/types/api';
import type { RiskCategory, RiskQuestionsResponse } from '@/types/risk-assessment';

export const WAITLIST_RISK_ACCESS_TOKEN = 'waitlist-risk-access-token';
export const FULL_SESSION_RISK_ACCESS_TOKEN = 'full-session-risk-access-token';

export const waitlistSignupFixture: WaitlistSignupResponse = {
  message: 'Added to the GigSecure waitlist',
  user_id: 'waitlist-user-0001',
  access_token: WAITLIST_RISK_ACCESS_TOKEN,
  token_type: 'bearer',
};

export const riskCategoriesFixture: RiskCategory[] = ['tech_freelancer'];

export const riskQuestionsFixture: RiskQuestionsResponse = {
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
        { id: 'smoker', text: 'Are you a smoker?', type: 'boolean' },
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
};

export const assessmentPayloadFixture: TechAssessmentInput = {
  first_name: 'Oluwakanyinsola',
  last_name: 'Adebayo-Akinyemi',
  date_of_birth: '1995-06-15',
  gender: 'female',
  state: 'Lagos',
  city: 'Ikeja',
  occupation: 'tech_freelancer',
  marital_status: 'single',
  job_type: 'Web Development',
  freelance_duration: '3-5 years',
  client_geography: 'Global',
  work_mode: 'Fully remote',
  weekly_hours: '20-40',
  monthly_income_band: '₦100k-₦500k',
  income_stability: 'Somewhat stable',
  income_sources: '2-3',
  biggest_client_loss: '25-50%',
  past_risks: ['Late payments'],
  top_worries: ['Income loss', 'Equipment damage'],
  equipment_dependency: 'Completely dependent',
  pre_existing_conditions: false,
  chronic_illness: false,
  smoker: false,
  health_rating: 4,
  travel_frequency: 'Rarely',
  survival_3_months: 'Yes, but tight',
  savings_duration: '1-2 months',
  insurance_types: [],
  insurance_claims: 'Never',
  protection_priority: 'Income protection',
};

const assessmentResponseBase: AssessmentResponse = {
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
  pillar_scores: { income: 72, client: 45, safety: 80, equipment: 35, health: 55 },
  overall_score: 68.5,
  risk_profile: 'Moderate Risk',
  recommendations: [
    'Build an emergency reserve that can cover at least three months of essential expenses.',
    'Consider income protection suited to irregular freelance earnings and client-payment delays.',
  ],
  recommended_categories: ['Income Protection', 'Equipment Protection'],
  ai_insights:
    'Your income is moderately stable, but a long client payment delay or loss of essential equipment could interrupt your ability to earn.',
};

export const publicAssessmentResponseFixture: AssessmentResponse = {
  ...assessmentResponseBase,
};

export const dashboardAssessmentResponseFixture: AssessmentResponse = {
  ...assessmentResponseBase,
  ai_insights:
    'Your project-based income remains moderately stable. The strongest next step is to reduce equipment dependency while building a larger emergency reserve.',
};

export const emptyAssessmentResponseFixture: AssessmentResponse = {
  ...assessmentResponseBase,
  recommendations: [],
  recommended_categories: [],
  ai_insights: '',
};

export const assessmentHistoryFixture: AssessmentSummary[] = [
  {
    id: 'assessment-summary-001',
    category: 'tech_freelancer',
    first_name: 'Oluwakanyinsola',
    last_name: 'Adebayo-Akinyemi',
    age: 31,
    overall_score: 68.5,
    risk_profile: 'Moderate Risk',
    created_at: '2026-07-06T09:30:00Z',
  },
  {
    id: 'assessment-summary-002',
    category: 'tech_freelancer',
    first_name: null,
    last_name: null,
    age: null,
    overall_score: 54,
    risk_profile: 'Moderate Risk',
    created_at: '2026-04-02T13:15:00Z',
  },
];

export const riskRecommendationsFixture: RecommendationsResponse = {
  recommendations: [
    'Diversify your client base to reduce income volatility.',
    'Maintain a documented equipment replacement plan.',
  ],
  overall_score: 68.5,
  risk_profile: 'Moderate Risk',
};

export const emptyRiskRecommendationsFixture: RecommendationsResponse = {
  recommendations: [],
  overall_score: null,
  risk_profile: null,
};

export const malformedRiskFixtures = {
  categories: [{ id: 'category-001', name: 'Tech Freelancer', slug: 'tech_freelancer' }],
  questions: { ...riskQuestionsFixture, steps: [] },
  assessment: { ...publicAssessmentResponseFixture, overall_score: 101 },
  history: [{ ...assessmentHistoryFixture[0], overall_score: -1 }],
  recommendations: [{ product_id: 'product-001', reason: 'Removed product-array shape' }],
} as const;

export const riskErrorFixtures = {
  unauthorized: { detail: 'Not authenticated' },
  expired: { detail: 'Token is invalid or expired' },
  server: { detail: 'Risk assessment service is temporarily unavailable.' },
  validation: {
    detail: [
      {
        loc: ['body', 'occupation'],
        msg: 'Assessment category must match the request path',
        type: 'value_error.category_mismatch',
      },
    ],
  },
} as const;
