'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import { useWizardStore } from '@/store/wizard-store';
import { useAuthStore } from '@/store/auth-store';
import { useCurrentUser } from '@/hooks/user/useUser';
import { useRiskCategories } from '@/hooks/risk/useRisk';
import StepWrapper from './StepWrapper';

const personalDetailsSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required').regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format must be dd/mm/yyyy'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select gender' }),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  marital_status: z.enum(['Married', 'Single', 'Divorced'], { message: 'Please select marital status' }),
});

type FormValues = z.infer<typeof personalDetailsSchema>;

export default function StepPersonalDetails() {
  const { answers, setStepAnswers, nextStep, setSelectedCategory } = useWizardStore();
  const authFirstName = useAuthStore((s) => s.firstName);
  const authLastName = useAuthStore((s) => s.lastName);
  const { data: userResponse } = useCurrentUser();
  const { data: categories } = useRiskCategories();

  const me = userResponse?.user;
  const profile = userResponse?.profile;

  const [hasPrefilled, setHasPrefilled] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(personalDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: (answers.first_name as string) || authFirstName || '',
      last_name: (answers.last_name as string) || authLastName || '',
      date_of_birth: (answers.date_of_birth as string) || '',
      gender: (answers.gender as any) || undefined,
      state: (answers.state as string) || '',
      city: (answers.city as string) || '',
      occupation: (answers.occupation as string) || '',
      marital_status: (answers.marital_status as any) || undefined,
    },
  });

  // Pre-fill fields from useCurrentUser if they are empty in answers
  useEffect(() => {
    if (userResponse && !hasPrefilled) {
      if (me?.first_name && !form.getValues('first_name')) form.setValue('first_name', me.first_name, { shouldValidate: true });
      if (me?.last_name && !form.getValues('last_name')) form.setValue('last_name', me.last_name, { shouldValidate: true });
      if (profile?.state && !form.getValues('state')) form.setValue('state', profile.state, { shouldValidate: true });
      if (profile?.city && !form.getValues('city')) form.setValue('city', profile.city, { shouldValidate: true });
      if (profile?.gender && !form.getValues('gender')) {
        const genderVal = profile.gender.toLowerCase();
        if (['male', 'female', 'other'].includes(genderVal)) {
          form.setValue('gender', genderVal as any, { shouldValidate: true });
        }
      }
      setHasPrefilled(true);
    }
  }, [userResponse, me, profile, form, hasPrefilled]);

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
              placeholder="Enter your full name"
              {...form.register('first_name')}
              disabled={!!me?.first_name}
              className={inputClassName}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={18} />
            </div>
          </div>
          {form.formState.errors.first_name && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.first_name.message}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-bold text-[#334155] mb-2 font-body">Last-Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              id="last_name"
              type="text"
              placeholder="Enter your full name"
              {...form.register('last_name')}
              disabled={!!me?.last_name}
              className={inputClassName}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={18} />
            </div>
          </div>
          {form.formState.errors.last_name && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.last_name.message}</p>}
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
              />
            )}
          />
          {form.formState.errors.date_of_birth && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.date_of_birth.message}</p>}
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
                disabled={!!profile?.gender}
                hasError={!!form.formState.errors.gender}
              />
            )}
          />
          {form.formState.errors.gender && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.gender.message}</p>}
        </div>

        {/* State of Residence */}
        <div>
          <label htmlFor="state" className="block text-sm font-bold text-[#334155] mb-2 font-body">State of Residence <span className="text-red-500">*</span></label>
          <input
            id="state"
            type="text"
            placeholder="Enter your state"
            {...form.register('state')}
            disabled={!!profile?.state}
            className={inputClassName}
          />
          {form.formState.errors.state && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.state.message}</p>}
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-bold text-[#334155] mb-2 font-body">City <span className="text-red-500">*</span></label>
          <input
            id="city"
            type="text"
            placeholder="Enter your city"
            {...form.register('city')}
            disabled={!!profile?.city}
            className={inputClassName}
          />
          {form.formState.errors.city && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.city.message}</p>}
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
                options={(categories || []).map((cat: any) => {
                  const val = typeof cat === 'string' ? cat : cat.category;
                  return { value: val, label: val };
                })}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select occupation"
                hasError={!!form.formState.errors.occupation}
              />
            )}
          />
          {form.formState.errors.occupation && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.occupation.message}</p>}
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
                ]}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select marital status"
                hasError={!!form.formState.errors.marital_status}
              />
            )}
          />
          {form.formState.errors.marital_status && <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.marital_status.message}</p>}
        </div>

      </div>
    </StepWrapper>
  );
}
