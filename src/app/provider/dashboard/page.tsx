
'use client';

import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/session-provider';
import { BookingCard } from '@/components/booking-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquareWarning, Wrench, FileText, Loader2, Download } from 'lucide-react';
import { ProviderComplaintCard } from '@/components/provider-complaint-card';
import { Booking, Payment } from '@/lib/types';
import type { Complaint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function ProviderDashboardPage() {
  const { profile } = useSession();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestingInvoice, setIsRequestingInvoice] = useState(false);

  const fetchProviderData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
        const [bookingsRes, complaintsRes, paymentsRes] = await Promise.all([
            fetch('/api/bookings'),
            fetch('/api/complaints'),
            fetch('/api/payments'),
        ]);

        if (bookingsRes.ok) {
            const allBookings = await bookingsRes.json();
            setBookings(allBookings); // Keep all bookings for invoice generation
        }

        if (complaintsRes.ok) {
            const allComplaints: Complaint[] = await complaintsRes.json();
            const providerComplaints = allComplaints.filter((c) => c.provider === profile.name);
            setComplaints(providerComplaints);
        }
        
        if (paymentsRes.ok) {
            const allPayments: Payment[] = await paymentsRes.json();
            setPayments(allPayments.filter(p => p.providerName === profile.name));
        }

    } catch (error) {
        console.error("Failed to fetch provider data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, [profile]);
  
  const handleRequestInvoice = async () => {
    if (!profile) return;
    setIsRequestingInvoice(true);
    try {
        const response = await fetch('/api/invoice-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                providerId: profile.uid,
                providerName: profile.name
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to request invoice.');
        }
        toast({
            title: 'Invoice Requested',
            description: 'The admin has been notified of your monthly invoice request.'
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: (error as Error).message
        });
    } finally {
        setIsRequestingInvoice(false);
    }
  };

  const generateInvoice = (payment: Payment) => {
    const doc = new jsPDF();
    
    const paymentBookings = bookings.filter(b => payment.bookingIds.includes(b._id));

    doc.setFontSize(22);
    doc.text('Payment Invoice', 14, 22);
    doc.setFontSize(12);
    doc.text(`Provider: ${payment.providerName}`, 14, 32);
    doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 14, 38);
    doc.text(`Payment ID: ${payment._id}`, 14, 44);

    doc.autoTable({
        startY: 50,
        head: [['Booking Date', 'Service', 'Client', 'Service Price']],
        body: paymentBookings.map(b => [
            new Date(b.date).toLocaleDateString('en-CA'),
            b.service,
            b.userName,
            `$${b.price.toFixed(2)}`
        ]),
        foot: [['', '', 'Total Payout', `$${payment.amount.toFixed(2)}`]],
        footStyles: {
            fontStyle: 'bold',
            fillColor: [230, 230, 230]
        }
    });

    doc.save(`invoice-${payment.providerName}-${new Date(payment.paymentDate).toISOString().split('T')[0]}.pdf`);
  };


  const providerBookings = bookings.filter(b => b.provider === profile?.name);
  const columns: Booking['status'][] = ['Aligned', 'In Process', 'Completed'];

  if (!profile) {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  const handleUpdate = () => {
    // Refetch data after an update
    fetchProviderData();
  }

  const pendingComplaints = complaints
    .filter(c => c.status === 'Pending')
    .map(c => ({
        ...c,
        lastResponseHours: c.lastResponseTimestamp
            ? Math.round((new Date().getTime() - new Date(c.lastResponseTimestamp).getTime()) / 3600000)
            : Math.round((new Date().getTime() - new Date(c.date).getTime()) / 3600000),
    }));


  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          {profile.name} Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your assigned jobs and respond to client feedback.
        </p>
      </div>

       <Tabs defaultValue="jobs">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="jobs">
                <Wrench className="mr-2 h-4 w-4"/>
                Assigned Jobs
            </TabsTrigger>
            <TabsTrigger value="complaints">
                <MessageSquareWarning className="mr-2 h-4 w-4"/>
                Complaints
                {pendingComplaints.length > 0 && <Badge className="ml-2">{pendingComplaints.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="billing">
                <FileText className="mr-2 h-4 w-4"/>
                Billing
            </TabsTrigger>
        </TabsList>
        <TabsContent value="jobs" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {loading ? (
                columns.map(status => (
                    <div key={status} className="space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ))
            ) : (
                columns.map(status => (
                <div key={status} className="space-y-4 p-4 bg-muted/50 rounded-lg h-full">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                    {status}
                    <Badge variant="secondary" className="h-6">{providerBookings.filter(b => b.status === status).length}</Badge>
                    </h2>
                    <div className="space-y-4">
                    {providerBookings
                        .filter(b => b.status === status)
                        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(booking => (
                        <BookingCard 
                            key={booking._id} 
                            booking={booking} 
                            userRole="provider" 
                            commissionPercentage={profile.commissionPercentage} 
                            onUpdate={handleUpdate} 
                        />
                    ))}
                    {providerBookings.filter(b => b.status === status).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No jobs in this stage.</p>
                    )}
                    </div>
                </div>
                ))
            )}
            </div>
        </TabsContent>
        <TabsContent value="complaints" className="mt-8">
            <div className="grid gap-6 max-w-4xl mx-auto">
                {loading ? (
                    <><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></>
                ) : pendingComplaints.length > 0 ? (
                    pendingComplaints.map((complaint) => (
                        <ProviderComplaintCard key={complaint._id} complaint={complaint} onUpdate={handleUpdate}/>
                    ))
                ) : (
                    <div className='text-center text-muted-foreground bg-card p-8 rounded-lg border'>
                        <p>You have no pending complaints.</p>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="billing" className="mt-8">
             <div className="max-w-4xl mx-auto space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Request Invoice</CardTitle>
                        <CardDescription>
                            When you are ready to receive payment for all completed services for the current month, you can notify the admin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full sm:w-auto" size="lg" onClick={handleRequestInvoice} disabled={isRequestingInvoice}>
                           {isRequestingInvoice ? (
                             <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Requesting...
                             </>
                           ) : "Request Monthly Invoice"}
                        </Button>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>
                            A history of all payments you have received.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="w-full h-32" />
                        ) : (
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Date</TableHead>
                                       <TableHead># Services</TableHead>
                                       <TableHead className="text-right">Amount</TableHead>
                                       <TableHead className="text-center">Invoice</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {payments.length > 0 ? (
                                       payments.map(payment => (
                                           <TableRow key={payment._id}>
                                               <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                               <TableCell>{payment.bookingIds.length}</TableCell>
                                               <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                                               <TableCell className="text-center">
                                                   <Button variant="ghost" size="sm" onClick={() => generateInvoice(payment)}>
                                                      <Download className="mr-2 h-4 w-4" />
                                                      Download
                                                   </Button>
                                               </TableCell>
                                           </TableRow>
                                       ))
                                   ) : (
                                       <TableRow>
                                           <TableCell colSpan={4} className="h-24 text-center">
                                               You have not received any payments yet.
                                           </TableCell>
                                       </TableRow>
                                   )}
                               </TableBody>
                           </Table>
                        )}
                    </CardContent>
                 </Card>
             </div>
        </TabsContent>
       </Tabs>
    </div>
  );
}
