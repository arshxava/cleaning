
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
  Receipt,
} from 'lucide-react';
import Image from 'next/image';

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
import { cn } from '@/lib/utils';
import { useSession } from '@/components/session-provider';
import { useEffect, useState } from 'react';
import { Complaint, InvoiceRequest } from '@/lib/types';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useSession();
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [complaintsRes, invoicesRes] = await Promise.all([
           fetch('/api/complaints'),
           fetch('/api/invoice-requests?status=pending')
        ]);

        if (complaintsRes.ok) {
          const data: Complaint[] = await complaintsRes.json();
          const pendingCount = data.filter(c => c.status === 'Pending').length;
          setPendingComplaints(pendingCount);
        }
        
        if (invoicesRes.ok) {
            const data: InvoiceRequest[] = await invoicesRes.json();
            setPendingInvoices(data.length);
        }

      } catch (error) {
        console.error(error);
      }
    };

    fetchAdminData();
    
    // Poll for new data every 30 seconds
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);

  }, []);

  const navLinks = [
    { href: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning, badge: pendingComplaints },
    { href: '/admin/buildings', label: 'Buildings', icon: Building },
    { href: '/admin/providers', label: 'Providers', icon: HardHat },
    { href: '/admin/ongoing-services', label: 'Ongoing Services', icon: Briefcase },
    { href: '/admin/billing', label: 'Billing', icon: Receipt, badge: pendingInvoices },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
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
              <Image src="/logo.png" alt="A+ Cleaning Admin" width={150} height={40} />
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
                    pathname === link.href && "bg-muted text-primary"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                   {link.badge && link.badge > 0 ? (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      {link.badge}
                    </Badge>
                  ) : null}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
