
import Header from '@/components/header';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
  );
}
