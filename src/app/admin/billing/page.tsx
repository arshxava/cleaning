
'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  Loader2,
  BellRing,
  CheckCircle,
} from 'lucide-react';
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


type ProviderProfile = UserProfile & { role: 'provider' };

type ProviderBillingInfo = {
  provider: ProviderProfile;
  totalServiceValue: number;
  totalPayoutDue: number;
  unpaidBookings: Booking[];
  paidBookings: Booking[];
}

export default function BillingPage() {
  const { toast } = useToast();
  const [billingData, setBillingData] = useState<ProviderBillingInfo[]>([]);
  const [invoiceRequests, setInvoiceRequests] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingProvider, setPayingProvider] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
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

  const handlePayProvider = async (providerName: string, unpaidBookingIds: string[], amount: number) => {
     setPayingProvider(providerName);
     try {
        const providerRequest = invoiceRequests.find(req => req.providerName === providerName);
        
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
        <div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold">
            Provider Billing
            </h1>
            <p className="text-muted-foreground mt-2">
            Manage and process payments for your service providers based on completed jobs.
            </p>
        </div>
      </div>
      
      {loading ? (
          <Skeleton className="h-32 w-full" />
      ) : invoiceRequests.length > 0 && (
          <Card className="mb-8 bg-amber-50 border-amber-300">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                      <BellRing />
                      Pending Invoice Requests
                  </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
          </Card>
      )}
      
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
                          Pay Provider
                        </>
                      )}
                    </Button>
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
