import Footer from '@/components/footer';
import Header from '@/components/header';
import { SessionProvider } from '@/components/session-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
  );
}
