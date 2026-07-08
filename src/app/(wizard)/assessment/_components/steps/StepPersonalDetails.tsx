'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import ComboboxSelect from '@/components/ui/ComboboxSelect';
import { useWizardStore } from '@/store/wizard-store';
import {
  type WizardPersonalDetailsDefaults,
} from '@/lib/risk/profile-to-wizard-defaults';
import type { RiskCategory } from '@/types/risk-assessment';
import type { ApiFieldErrors } from '@/types/api';
import {
  getCitiesByState,
  getStateNames,
  isValidCityForState,
  isValidState,
} from '@/lib/data/nigeriaStates';
import StepWrapper from './StepWrapper';

const GENDER_VALUES = ['male', 'female', 'other'] as const;
const MARITAL_STATUS_VALUES = ['Married', 'Single', 'Divorced', 'Separated'] as const;

const personalDetailsSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    date_of_birth: z
      .string()
      .min(1, 'Date of birth is required')
      .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format must be dd/mm/yyyy'),
    gender: z.enum(['male', 'female', 'other'], { message: 'Please select gender' }),
    state: z
      .string()
      .min(1, 'State is required')
      .refine((value) => isValidState(value), 'Please select a valid state'),
    city: z.string().min(1, 'City is required'),
    occupation: z.string().min(1, 'Occupation is required'),
    marital_status: z.enum(['Married', 'Single', 'Divorced', 'Separated'], {
      message: 'Please select marital status',
    }),
  })
  .superRefine((values, ctx) => {
    if (values.state && values.city && !isValidCityForState(values.state, values.city)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['city'],
        message: 'Please select a valid city for the selected state',
      });
    }
  });

type FormValues = z.infer<typeof personalDetailsSchema>;

function getAllowedValue<T extends string>(value: unknown, allowedValues: readonly T[]): T | undefined {
  return typeof value === 'string' && allowedValues.includes(value as T)
    ? (value as T)
    : undefined;
}

type StepPersonalDetailsProps = {
  initialDefaults?: Partial<WizardPersonalDetailsDefaults>;
  categories?: RiskCategory[];
  isCategoriesLoading?: boolean;
  serverFieldErrors?: ApiFieldErrors;
};

const PERSONAL_DETAIL_FIELDS = [
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',
  'state',
  'city',
  'occupation',
  'marital_status',
] as const satisfies ReadonlyArray<keyof WizardPersonalDetailsDefaults>;

export default function StepPersonalDetails({
  initialDefaults = {},
  categories = [],
  isCategoriesLoading = false,
  serverFieldErrors = {},
}: StepPersonalDetailsProps) {
  const answers = useWizardStore((state) => state.answers);
  const setStepAnswers = useWizardStore((state) => state.setStepAnswers);
  const nextStep = useWizardStore((state) => state.nextStep);
  const setSelectedCategory = useWizardStore((state) => state.setSelectedCategory);
  const appliedDefaults = useRef<Partial<WizardPersonalDetailsDefaults>>({});
  const defaults = useMemo(() => ({ ...initialDefaults, ...answers }), [answers, initialDefaults]);
  const stateOptions = useMemo(
    () => getStateNames().map((stateName) => ({ value: stateName, label: stateName })),
    []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(personalDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: typeof defaults.first_name === 'string' ? defaults.first_name : '',
      last_name: typeof defaults.last_name === 'string' ? defaults.last_name : '',
      date_of_birth: typeof defaults.date_of_birth === 'string' ? defaults.date_of_birth : '',
      gender: getAllowedValue(defaults.gender, GENDER_VALUES),
      state: typeof defaults.state === 'string' ? defaults.state : '',
      city: typeof defaults.city === 'string' ? defaults.city : '',
      occupation: typeof defaults.occupation === 'string' ? defaults.occupation : '',
      marital_status: getAllowedValue(defaults.marital_status, MARITAL_STATUS_VALUES),
    },
  });

  useEffect(() => {
    for (const field of PERSONAL_DETAIL_FIELDS) {
      const message = serverFieldErrors[field]?.[0];
      if (message) form.setError(field, { type: 'server', message });
    }
  }, [form, serverFieldErrors]);

  useEffect(() => {
    for (const field of PERSONAL_DETAIL_FIELDS) {
      if (form.getValues(field)) continue;
      const value = initialDefaults[field];
      if (!value || appliedDefaults.current[field] === value) continue;

      if (field === 'gender' && !getAllowedValue(value, GENDER_VALUES)) continue;
      if (field === 'marital_status' && !getAllowedValue(value, MARITAL_STATUS_VALUES)) continue;
      form.setValue(field, value as FormValues[typeof field], { shouldValidate: true });
      appliedDefaults.current[field] = value;
    }
  }, [form, initialDefaults]);

  const selectedState = useWatch({ control: form.control, name: 'state' });
  const cityOptions = useMemo(
    () => getCitiesByState(selectedState).map((cityName) => ({ value: cityName, label: cityName })),
    [selectedState]
  );

  useEffect(() => {
    const currentCity = form.getValues('city');
    if (!currentCity || !selectedState) return;

    if (!isValidCityForState(selectedState, currentCity)) {
      form.setValue('city', '', { shouldValidate: true, shouldDirty: true });
    }
  }, [form, selectedState]);

  const onNext = form.handleSubmit((values) => {
    setStepAnswers({
      first_name: values.first_name,
      last_name: values.last_name,
      date_of_birth: values.date_of_birth,
      gender: values.gender,
      state: values.state,
      city: values.city,
      occupation: values.occupation,
      marital_status: values.marital_status,
    });
    // Store category explicitly for router
    setSelectedCategory(values.occupation);
    nextStep();
  });

  // Helper for applying uniform styling
  const inputClassName = "w-full h-[52px] rounded-lg border border-gray-200 bg-[#F8FAFC] px-4 font-body text-[15px] text-gray-900 focus:border-[#004E4C] focus:outline-none focus:ring-1 focus:ring-[#004E4C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <StepWrapper
      title="Let's get to know you"
      subtitle="This information helps us personalize your risk insights and provide tailored insurance recommendations."
      onNext={onNext}
      onBack={() => {}} // No back on step 1
      isFirstStep={true}
      isLastStep={false}
      isValid={form.formState.isValid}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-2">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-bold text-[#334155] mb-2 font-body">First-Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              placeholder="Enter your first name"
              {...form.register('first_name')}
              aria-invalid={form.formState.errors.first_name ? true : undefined}
              aria-describedby={form.formState.errors.first_name ? 'first_name-error' : undefined}
              className={inputClassName}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User aria-hidden="true" size={18} />
            </div>
          </div>
          {form.formState.errors.first_name && <p id="first_name-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.first_name.message}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-bold text-[#334155] mb-2 font-body">Last-Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              placeholder="Enter your last name"
              {...form.register('last_name')}
              aria-invalid={form.formState.errors.last_name ? true : undefined}
              aria-describedby={form.formState.errors.last_name ? 'last_name-error' : undefined}
              className={inputClassName}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User aria-hidden="true" size={18} />
            </div>
          </div>
          {form.formState.errors.last_name && <p id="last_name-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.last_name.message}</p>}
        </div>

        {/* Date of Birth */}
        <div className="md:col-span-2">
          <label htmlFor="date_of_birth" className="block text-sm font-bold text-[#334155] mb-2 font-body">Date of Birth <span className="text-red-500">*</span></label>
          <Controller
            name="date_of_birth"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                id="date_of_birth"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!form.formState.errors.date_of_birth}
                ariaDescribedBy={form.formState.errors.date_of_birth ? 'date_of_birth-error' : undefined}
              />
            )}
          />
          {form.formState.errors.date_of_birth && <p id="date_of_birth-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.date_of_birth.message}</p>}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-bold text-[#334155] mb-2 font-body">Gender <span className="text-red-500">*</span></label>
          <Controller
            name="gender"
            control={form.control}
            render={({ field }) => (
              <Select
                id="gender"
                name={field.name}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select gender"
                hasError={!!form.formState.errors.gender}
                ariaDescribedBy={form.formState.errors.gender ? 'gender-error' : undefined}
              />
            )}
          />
          {form.formState.errors.gender && <p id="gender-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.gender.message}</p>}
        </div>

        {/* State of Residence */}
        <div>
          <label htmlFor="state" className="block text-sm font-bold text-[#334155] mb-2 font-body">State of Residence <span className="text-red-500">*</span></label>
          <Controller
            name="state"
            control={form.control}
            render={({ field }) => (
              <ComboboxSelect
                id="state"
                name={field.name}
                options={stateOptions}
                value={field.value}
                onChange={(nextState) => {
                  field.onChange(nextState);
                  const currentCity = form.getValues('city');
                  if (currentCity && !isValidCityForState(nextState, currentCity)) {
                    form.setValue('city', '', { shouldValidate: true, shouldDirty: true });
                  }
                }}
                onBlur={field.onBlur}
                placeholder="Select your state"
                searchPlaceholder="Search state…"
                hasError={!!form.formState.errors.state}
                ariaDescribedBy={form.formState.errors.state ? 'state-error' : undefined}
              />
            )}
          />
          {form.formState.errors.state && <p id="state-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.state.message}</p>}
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-bold text-[#334155] mb-2 font-body">City <span className="text-red-500">*</span></label>
          <Controller
            name="city"
            control={form.control}
            render={({ field }) => (
              <Select
                id="city"
                name={field.name}
                options={cityOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={selectedState ? 'Select city' : 'Select state first'}
                disabled={!selectedState}
                hasError={!!form.formState.errors.city}
                ariaDescribedBy={form.formState.errors.city ? 'city-error' : undefined}
              />
            )}
          />
          {form.formState.errors.city && <p id="city-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.city.message}</p>}
        </div>

        {/* Occupation */}
        <div>
          <label htmlFor="occupation" className="block text-sm font-bold text-[#334155] mb-2 font-body">Occupation <span className="text-red-500">*</span></label>
          <Controller
            name="occupation"
            control={form.control}
            render={({ field }) => (
              <Select
                id="occupation"
                name={field.name}
                options={(categories || []).map((cat) => {
                  if (typeof cat === 'string') {
                    return { value: cat, label: cat };
                  }

                  return {
                    value: cat.category,
                    label: cat.title ?? cat.category,
                  };
                })}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select occupation"
                disabled={isCategoriesLoading}
                hasError={!!form.formState.errors.occupation}
                ariaDescribedBy={form.formState.errors.occupation ? 'occupation-error' : undefined}
              />
            )}
          />
          {form.formState.errors.occupation && <p id="occupation-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.occupation.message}</p>}
          {isCategoriesLoading && <p className="mt-1.5 text-xs text-gray-500" role="status">Loading occupations…</p>}
        </div>

        {/* Marital Status */}
        <div className="md:col-span-2">
          <label htmlFor="marital_status" className="block text-sm font-bold text-[#334155] mb-2 font-body">Marital Status <span className="text-red-500">*</span></label>
          <Controller
            name="marital_status"
            control={form.control}
            render={({ field }) => (
              <Select
                id="marital_status"
                name={field.name}
                options={[
                  { value: 'Married', label: 'Married' },
                  { value: 'Single', label: 'Single' },
                  { value: 'Divorced', label: 'Divorced' },
                  { value: 'Separated', label: 'Separated' },
                ]}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select marital status"
                hasError={!!form.formState.errors.marital_status}
                ariaDescribedBy={form.formState.errors.marital_status ? 'marital_status-error' : undefined}
              />
            )}
          />
          {form.formState.errors.marital_status && <p id="marital_status-error" className="mt-1.5 text-xs text-red-500">{form.formState.errors.marital_status.message}</p>}
        </div>

      </div>
    </StepWrapper>
  );
}
