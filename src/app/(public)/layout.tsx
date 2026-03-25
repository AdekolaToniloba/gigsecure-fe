import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WaitlistModal from '@/components/ui/WaitlistModal';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col pt-20">
      <Navbar />
      <main className="flex-1 flex flex-col w-full relative">
        {children}
      </main>
      <Footer />
      <WaitlistModal />
    </div>
  );
}
