
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  Users,
  Building,
  MessageSquareWarning,
  HardHat,
  Briefcase,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/session-provider';
import { useEffect, useState } from 'react';

type Complaint = {
  id: string;
  status: 'Pending' | 'Resolved';
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useSession();
  const [pendingComplaints, setPendingComplaints] = useState(0);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/complaints');
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        const data: Complaint[] = await response.json();
        const pendingCount = data.filter(c => c.status === 'Pending').length;
        setPendingComplaints(pendingCount);
      } catch (error) {
        console.error(error);
      }
    };

    fetchComplaints();
  }, []);

  const navLinks = [
    { href: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { href: '/admin/buildings', label: 'Buildings', icon: Building },
    { href: '/admin/providers', label: 'Providers', icon: HardHat },
    { href: '/admin/ongoing-services', label: 'Ongoing Services', icon: Briefcase },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: LineChart, disabled: true },
  ];

  if (profile?.role !== 'admin') {
    return null; // Or a loading/unauthorized component
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin/complaints" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">A+ Cleaning Admin</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map(link => (
                 <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname === link.href && "bg-muted text-primary",
                    link.disabled && "pointer-events-none opacity-50"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                   {link.href === '/admin/complaints' && pendingComplaints > 0 && (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      {pendingComplaints}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  Contact support for any questions or issues.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
