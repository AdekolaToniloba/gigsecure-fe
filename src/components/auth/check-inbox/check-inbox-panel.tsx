import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import ResendActivationForm from './resend-activation-form';

export default function CheckInboxPanel() {
  return (
    <div className="w-full max-w-[38.5rem]">
      <div className="rounded-2xl bg-primary-muted px-8 py-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-accent">
          <MailCheck aria-hidden="true" className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">
          Check your inbox
        </h1>
        <p className="mx-auto mt-3 max-w-[28rem] text-sm leading-6 text-slate-600">
          We sent a verification link to your email. Open it to verify your
          account and continue your GigSecure setup.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold text-slate-900">
          Need another link?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter the email you registered with and we&apos;ll send another
          activation link if the account exists.
        </p>
        <ResendActivationForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already verified?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
