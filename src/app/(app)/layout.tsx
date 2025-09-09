import { SessionProvider } from '@/components/session-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
