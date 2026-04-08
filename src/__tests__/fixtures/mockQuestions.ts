import type { RiskQuestionsResponse } from '@/types/risk-assessment';

export const mockQuestionsResponse: RiskQuestionsResponse = {
  category: 'tech_freelancer',
  title: 'Risk Assessment for Tech Freelancers',
  description: 'Evaluate your risk exposure as a tech freelancer',
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
};
