import Footer from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/shared/protected-route";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-6 py-8">
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
      <Footer />
    </div>
  );
}
