'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Check, Lock, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useWaitlistSignup } from '@/hooks/auth/useAuth';
import { waitlistSignupRequestSchema, type WaitlistSignupRequest } from '@/lib/validators/auth';
import { assetUrl, ASSETS } from '@/lib/assets';

const BENEFITS = [
  "Be first to compare and activate coverage plans",
  "Exclusive launch pricing locked in before public release",
  "Your risk profile saved and ready when we launch"
];

export default function WaitlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const { mutateAsync: signup, isPending } = useWaitlistSignup();
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WaitlistSignupRequest>({
    resolver: zodResolver(waitlistSignupRequestSchema),
  });

  const onSubmit = async (data: WaitlistSignupRequest) => {
    try {
      setFormError('');
      await signup(data);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/assessment');
      }, 2000);
    } catch (error: any) {
      setFormError(error?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left side - Dark Green Content */}
      <div className="bg-[#004E4C] w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen flex flex-col px-8 py-12 lg:p-16 relative overflow-hidden">
        {/* Decorative background visual */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative z-10 mb-12">
          <Image
            src={assetUrl(ASSETS.logo)}
            alt="GigSecure"
            width={160}
            height={40}
            className="h-8 w-auto object-contain cursor-pointer"
            priority
          />
        </Link>
        
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="flex h-12 w-16 items-center justify-center rounded-[8px] bg-white/10 mb-6 relative">
            <Mail className="text-[#FFE419] h-6 w-6" />
          </div>
          <h1 className="text-[#FFE419] font-heading text-[32px] sm:text-[40px] lg:text-[48px] font-bold leading-tight mb-6 max-w-xl">
            Join the early access list
          </h1>
          <p className="text-white/90 font-body text-[18px] lg:text-[20px] max-w-[480px] leading-relaxed">
            You're among the first freelancers shaping GigSecure.
            Drop your email and we'll reach out the moment coverage goes live.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-[480px]">
          {/* Session expired banner */}
          {isExpired && !isSuccess && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 mb-8">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-body">
                Your session expired. Please sign up to continue your assessment.
              </p>
            </div>
          )}

          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="h-20 w-20 bg-[#52B788]/20 rounded-full flex items-center justify-center mb-6">
                <Check className="h-10 w-10 text-[#52B788]" />
              </div>
              <h3 className="text-[28px] font-bold text-[#004E4C] mb-3 font-heading">You are on the list!</h3>
              <p className="text-gray-600 text-lg font-body mb-8">Thank you for joining. Preparing your assessment...</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col gap-4 mb-10">
                {BENEFITS.map((text, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#004E4C] flex-shrink-0">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="font-body text-[#334155] text-[16px] leading-relaxed">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-[#334155] mb-2 font-body">
                    Your Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full h-[56px] rounded-lg border border-gray-200 bg-[#F8FAFC] px-4 font-body text-[16px] text-gray-900 focus:border-[#004E4C] focus:outline-none focus:ring-1 focus:ring-[#004E4C] transition-colors"
                    placeholder="e.g. hello@example.com"
                  />
                  {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-bold text-[#334155] mb-2 font-body">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      {...register('first_name')}
                      className="w-full h-[56px] rounded-lg border border-gray-200 bg-[#F8FAFC] px-4 font-body text-[16px] text-gray-900 focus:border-[#004E4C] focus:outline-none focus:ring-1 focus:ring-[#004E4C] transition-colors"
                      placeholder="John"
                    />
                    {errors.first_name && <p className="mt-1.5 text-sm text-red-500">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-bold text-[#334155] mb-2 font-body">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      {...register('last_name')}
                      className="w-full h-[56px] rounded-lg border border-gray-200 bg-[#F8FAFC] px-4 font-body text-[16px] text-gray-900 focus:border-[#004E4C] focus:outline-none focus:ring-1 focus:ring-[#004E4C] transition-colors"
                      placeholder="Doe"
                    />
                    {errors.last_name && <p className="mt-1.5 text-sm text-red-500">{errors.last_name.message}</p>}
                  </div>
                </div>
                
                {formError && (
                  <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-3">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isPending}
                  type="submit"
                  className="w-full h-[60px] rounded-lg bg-[#FFE419] font-body text-[18px] font-bold text-[#004E4C] shadow-sm transition-colors hover:bg-[#EBD001] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] disabled:opacity-70 disabled:cursor-not-allowed mt-4 cursor-pointer flex justify-center items-center"
                >
                  {isPending ? 'Authenticating...' : 'Secure my Spot & Continue'}
                </motion.button>
              </form>

              <div className="mt-8 flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <Lock className="text-gray-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-[14px] text-gray-500 leading-relaxed font-body">
                  We'll only contact you about GigSecure. No spam, no third-party sharing. 
                  Unsubscribe anytime.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
