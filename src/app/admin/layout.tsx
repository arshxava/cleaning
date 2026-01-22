'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LineChart,
  Users,
  Building,
  MessageSquareWarning,
  HardHat,
  Briefcase,
  Receipt, FileText,CreditCard
} from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
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
          fetch('/api/invoice-requests?status=pending'),
        ]);

        if (complaintsRes.ok) {
          const data: Complaint[] = await complaintsRes.json();
          setPendingComplaints(
            data.filter(c => c.status === 'Pending').length
          );
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
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    {
      href: '/admin/complaints',
      label: 'Complaints',
      icon: MessageSquareWarning,
      badge: pendingComplaints,
    },
    { href: '/admin/buildings', label: 'Buildings', icon: Building },
    { href: '/admin/providers', label: 'Providers', icon: HardHat },
    {
      href: '/admin/ongoing-services',
      label: 'Ongoing Services',
      icon: Briefcase,
    },
    {
      href: '/admin/billing',
      label: 'Billing',
      icon: Receipt,
      badge: pendingInvoices,
    },
    {
  href: "/admin/payments",
  label: "Payments",
  icon: CreditCard,
},

    {
      href: '/admin/settings/terms',
      label: 'Terms & Conditions',
      icon: FileText,
    },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
  ];

  if (profile?.role !== 'admin') return null;

  return (
    <div className="min-h-screen w-full">
      {/* ✅ HEADER — FULL WIDTH */}
      <Header />

      {/* ✅ BODY GRID */}
      <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* SIDEBAR */}
        <aside className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full flex-col">
            <nav className="grid items-start px-2 py-4 text-sm font-medium lg:px-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    pathname === link.href && 'bg-muted text-primary'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {link.badge ? (
                    <Badge className="ml-auto h-6 w-6 rounded-full">
                      {link.badge}
                    </Badge>
                  ) : null}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex flex-col gap-4 p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
