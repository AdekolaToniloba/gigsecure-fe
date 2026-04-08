import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// import localFont from 'next/font/local';
// ↑ Uncomment and add the block below once you place Apercu Pro .woff2 files
//   in src/fonts/ (see src/fonts/README.md). next/font/local resolves files at
//   build time and will throw if the files are missing.
import './globals.css';
import Providers from '@/providers';
import { GoogleAnalytics } from '@next/third-parties/google';
import { env } from '@/lib/env';

// ─── Inter — body font ─────────────────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// ─── Apercu Pro — heading font (activate once files are in src/fonts/) ──────
// const apercu = localFont({
//   src: [
//     { path: '../fonts/ApercuPro-Regular.woff2', weight: '400', style: 'normal' },
//     { path: '../fonts/ApercuPro-Medium.woff2',  weight: '500', style: 'normal' },
//     { path: '../fonts/ApercuPro-Bold.woff2',    weight: '700', style: 'normal' },
//   ],
//   variable: '--font-apercu',
//   display: 'swap',
//   fallback: ['sans-serif'],
// });

export const metadata: Metadata = {
  title: {
    default: 'GigSecure',
    template: '%s | GigSecure',
  },
  description: 'Secure gig management platform.',
  verification: {
    google: 'Kx0-11hltt7ro_cSPdS61qlvbbeEL3TkaRbaBrY_ZVo',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // When Apercu Pro is active, add apercu.variable to the className:
    // <html lang="en" className={`${apercu.variable} ${inter.variable}`}>
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-body bg-background antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
