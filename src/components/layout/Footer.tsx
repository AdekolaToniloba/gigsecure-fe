import Link from 'next/link';
import Image from 'next/image';

const FOOTER_LINKS = [
  { label: 'Insurance Policies', href: '/policies' },
  { label: 'Buy', href: '/buy' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Terms and Conditions', href: '/termsandconditions' }, // Repeating as explicitly shown in the design
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#004E4C] text-white">
      {/* Top Section: Branding and Navigation */}
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          
          {/* Left: Logo and Description */}
          <div className="flex flex-col gap-6 max-w-sm">
            {/* Logo Wrapper */}
            <div className="flex items-center">
              <Link href="/" className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] rounded-sm">
                <Image 
                  src="/logo.png" 
                  alt="GigSecure Logo" 
                  width={150} 
                  height={40} 
                  className="object-contain"
                  priority
                />
              </Link>
            </div>

            <p className="font-body text-[15px] sm:text-base text-white/90 leading-relaxed md:max-w-[320px]">
              GigSecure evaluates your income patterns and work exposure to recommend coverage that fits how you actually earn.
            </p>
          </div>

          {/* Right: Navigation Links */}
          <nav aria-label="Footer Navigation">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-4">
              {FOOTER_LINKS.map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <Link 
                    href={link.href}
                    className="font-body text-sm sm:text-base font-semibold text-white hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] rounded-sm px-1 cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </div>
      </div>

      {/* Bottom Section: Copyright Bar */}
      <div className="w-full bg-[#1A1A1A]">
        <div className="mx-auto w-full max-w-7xl px-6 py-4 flex justify-center items-center">
          <p className="font-body text-sm text-white font-medium tracking-wide">
            @2026 All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
