
'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  Loader2,
  BellRing,
  FileText,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Booking, InvoiceRequest } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type ProviderProfile = UserProfile & { role: 'provider' };

type ProviderBillingInfo = {
  provider: ProviderProfile;
  totalServiceValue: number;
  totalPayoutDue: number;
  unpaidBookings: Booking[];
  paidBookings: Booking[];
}

const useMockData = process.env.NODE_ENV === 'development';

export default function BillingPage() {
  const { toast } = useToast();
  const [billingData, setBillingData] = useState<ProviderBillingInfo[]>([]);
  const [invoiceRequests, setInvoiceRequests] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingProvider, setPayingProvider] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      if (useMockData) {
        console.log("Using mock data for billing page.");
        
        const mockProviders: ProviderProfile[] = [
            { uid: 'provider-1', name: 'Quality First Sparkle', email: 'qfs@test.com', phone: '111-222-3333', role: 'provider', commissionPercentage: 15, createdAt: new Date() },
            { uid: 'provider-2', name: 'Ethan Hunt Services', email: 'ethan@test.com', phone: '444-555-6666', role: 'provider', commissionPercentage: 10, createdAt: new Date() },
        ];

        const mockBookings: Booking[] = [
            // Bookings for Quality First Sparkle
            { _id: 'booking-1', userId: 'user-1', userName: 'Alice', building: 'Chestnut Residence', service: 'Deep Clean', price: 120, status: 'Completed', provider: 'Quality First Sparkle', date: new Date(2024, 5, 15).toISOString(), providerPaid: false, roomCounts: { standard: 0, deep: 1, 'move-out': 0}, time: '', frequency: 'one-time', beforeImages:[], afterImages: [], createdAt: new Date() },
            { _id: 'booking-2', userId: 'user-2', userName: 'Bob', building: 'Chestnut Residence', service: 'Standard Clean', price: 75, status: 'Completed', provider: 'Quality First Sparkle', date: new Date(2024, 5, 18).toISOString(), providerPaid: false, roomCounts: { standard: 1, deep: 0, 'move-out': 0}, time: '', frequency: 'one-time', beforeImages:[], afterImages: [], createdAt: new Date() },
            { _id: 'booking-3', userId: 'user-3', userName: 'Charlie', building: 'New College', service: 'Standard Clean', price: 60, status: 'Completed', provider: 'Quality First Sparkle', date: new Date(2024, 5, 2).toISOString(), providerPaid: true, roomCounts: { standard: 1, deep: 0, 'move-out': 0}, time: '', frequency: 'one-time', beforeImages:[], afterImages: [], createdAt: new Date() },
            // Bookings for Ethan Hunt
            { _id: 'booking-4', userId: 'user-4', userName: 'Diana', building: 'Innis College', service: 'Move-In/Out Clean', price: 200, status: 'Completed', provider: 'Ethan Hunt Services', date: new Date(2024, 5, 20).toISOString(), providerPaid: false, roomCounts: { standard: 0, deep: 0, 'move-out': 1}, time: '', frequency: 'one-time', beforeImages:[], afterImages: [], createdAt: new Date() },
             // Unassigned booking
            { _id: 'booking-5', userId: 'user-5', userName: 'Eve', building: 'Woodsworth College', service: 'Deep Clean', price: 150, status: 'Completed', provider: 'Unassigned', date: new Date(2024, 5, 21).toISOString(), providerPaid: false, roomCounts: { standard: 0, deep: 1, 'move-out': 0}, time: '', frequency: 'one-time', beforeImages:[], afterImages: [], createdAt: new Date() },
        ];

        const mockInvoiceRequests: InvoiceRequest[] = [
            { _id: 'req-1', providerId: 'provider-1', providerName: 'Quality First Sparkle', requestDate: new Date(), status: 'pending', month: 5, year: 2024 }
        ];
        
        setInvoiceRequests(mockInvoiceRequests);

        const data: ProviderBillingInfo[] = mockProviders.map(provider => {
            const providerBookings = mockBookings.filter(b => b.provider === provider.name && b.status === 'Completed');
            const unpaidBookings = providerBookings.filter(b => !b.providerPaid);
            const paidBookings = providerBookings.filter(b => b.providerPaid);
            const totalServiceValue = providerBookings.reduce((sum, b) => sum + b.price, 0);
            const commissionPercentage = provider.commissionPercentage || 0;
            const totalPayoutDue = unpaidBookings.reduce((sum, b) => sum + (b.price - (b.price * (commissionPercentage / 100))), 0);
            return { provider, totalServiceValue, totalPayoutDue, unpaidBookings, paidBookings };
        });

        setBillingData(data);
        setLoading(false);
        return;
      }


      const [providersRes, bookingsRes, requestsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/bookings'),
        fetch('/api/invoice-requests?status=pending'),
      ]);

      if (!providersRes.ok) throw new Error('Failed to fetch providers');
      const allUsers: UserProfile[] = await providersRes.json();
      const providers = allUsers.filter(user => user.role === 'provider') as ProviderProfile[];

      if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
      const allBookings: Booking[] = await bookingsRes.json();
      const completedBookings = allBookings.filter(b => b.status === 'Completed');
      
      if (!requestsRes.ok) throw new Error('Failed to fetch invoice requests');
      const requestsData: InvoiceRequest[] = await requestsRes.json();
      setInvoiceRequests(requestsData);

      const data: ProviderBillingInfo[] = providers.map(provider => {
        const providerBookings = completedBookings.filter(b => b.provider === provider.name);
        
        const unpaidBookings = providerBookings.filter(b => !b.providerPaid);
        const paidBookings = providerBookings.filter(b => b.providerPaid);

        const totalServiceValue = providerBookings.reduce((sum, b) => sum + b.price, 0);

        const commissionPercentage = provider.commissionPercentage || 0;
        const totalPayoutDue = unpaidBookings.reduce((sum, b) => sum + (b.price - (b.price * (commissionPercentage / 100))), 0);

        return {
          provider,
          totalServiceValue,
          totalPayoutDue,
          unpaidBookings,
          paidBookings,
        };
      });

      setBillingData(data);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch billing data.',
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleGenerateInvoice = (info: ProviderBillingInfo) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Payout Invoice', 14, 22);
    doc.setFontSize(12);
    doc.text(`Provider: ${info.provider.name}`, 14, 32);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 14, 38);
    
    doc.autoTable({
        startY: 50,
        head: [['Booking Date', 'Service', 'Client', 'Service Price', 'Provider Earning']],
        body: info.unpaidBookings.map(b => {
            const earning = b.price - (b.price * ((info.provider.commissionPercentage || 0) / 100));
            return [
                new Date(b.date).toLocaleDateString('en-CA'),
                b.service,
                b.userName,
                `$${b.price.toFixed(2)}`,
                `$${earning.toFixed(2)}`
            ];
        }),
        foot: [['', '', '', 'Total Payout Due', `$${info.totalPayoutDue.toFixed(2)}`]],
        footStyles: {
            fontStyle: 'bold',
            fillColor: [230, 230, 230]
        }
    });

    doc.save(`invoice-${info.provider.name}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Invoice Generated", description: `PDF invoice for ${info.provider.name} has been downloaded.` });
  }

  const handlePayProvider = async (providerName: string, unpaidBookingIds: string[], amount: number) => {
     setPayingProvider(providerName);
     try {
        const providerRequest = invoiceRequests.find(req => req.providerName === providerName);
        
        // In mock mode, just simulate success
        if (useMockData) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        } else {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerName,
                    bookingIds: unpaidBookingIds,
                    amount,
                    paymentDate: new Date().toISOString(),
                    invoiceRequestId: providerRequest?._id
                })
            });

            if (!response.ok) {
                throw new Error("Payment processing failed.");
            }
        }

        toast({
            title: "Payment Successful",
            description: `${providerName} has been paid $${amount.toFixed(2)}.`,
        });
        
        fetchBillingData(); // Refresh data
     } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Payment Error',
            description: (error as Error).message
         })
     } finally {
        setPayingProvider(null);
     }
  }


  return (
    <>
       <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-headline font-bold">
                    Provider Billing
                </h1>
                {invoiceRequests.length > 0 && (
                    <div className="relative">
                        <BellRing className="h-6 w-6 text-muted-foreground" />
                        <Badge variant="destructive" className="absolute -top-2 -right-3 h-5 w-5 justify-center p-0">{invoiceRequests.length}</Badge>
                    </div>
                )}
            </div>
            <div>{/* Potentially add actions here */}</div>
        </div>
      
       <Card className="mb-8 bg-amber-50 border-amber-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                    <BellRing />
                    Pending Invoice Requests
                </CardTitle>
                 <CardDescription>Providers who have requested payment for the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-24 w-full" /> : invoiceRequests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead>Request Date</TableHead>
                                <TableHead>Invoice For</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoiceRequests.map(req => (
                                <TableRow key={req._id}>
                                    <TableCell className="font-medium">{req.providerName}</TableCell>
                                    <TableCell>{new Date(req.requestDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(req.year, req.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending invoice requests at this time.</p>
                )}
            </CardContent>
        </Card>
      
      {loading ? (
        <div className="grid gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      ) : billingData.length > 0 ? (
        <div className="grid gap-8">
          {billingData.map((info, index) => (
            <Card key={`${info.provider.uid}-${index}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {info.provider.name}
                        </CardTitle>
                        <CardDescription>
                            Commission Rate: {info.provider.commissionPercentage || 0}%
                        </CardDescription>
                    </div>
                    <Badge variant={info.totalPayoutDue > 0 ? 'destructive' : 'secondary'}>
                        {info.totalPayoutDue > 0 ? "Payment Due" : "Up to Date"}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Booking Date</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Service Value</TableHead>
                            <TableHead className="text-right">Provider Earning</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {info.unpaidBookings.length > 0 ? info.unpaidBookings.map(booking => (
                            <TableRow key={booking._id}>
                                <TableCell>{new Date(booking.date).toLocaleDateString('en-CA')}</TableCell>
                                <TableCell>{booking.service}</TableCell>
                                <TableCell>{booking.userName}</TableCell>
                                <TableCell className="text-right">${booking.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${(booking.price - (booking.price * ((info.provider.commissionPercentage || 0) / 100))).toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No unpaid services.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </CardContent>
              <Separator />
              <CardFooter className="flex justify-end items-center p-6 bg-muted/50">
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Payout Due</p>
                        <p className="text-2xl font-bold">${info.totalPayoutDue.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline"
                            onClick={() => handleGenerateInvoice(info)}
                            disabled={info.totalPayoutDue === 0}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Generate Invoice
                        </Button>
                        <Button 
                            size="lg" 
                            onClick={() => handlePayProvider(info.provider.name, info.unpaidBookings.map(b => b._id), info.totalPayoutDue)}
                            disabled={info.totalPayoutDue === 0 || payingProvider !== null}
                        >
                          {payingProvider === info.provider.name ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Pay Now
                            </>
                          )}
                        </Button>
                    </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>No provider data available to calculate billing.</p>
            </CardContent>
        </Card>
      )}
    </>
  );
}

    