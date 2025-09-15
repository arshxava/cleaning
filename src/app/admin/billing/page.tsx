
'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  Loader2,
  BellRing,
  FileText,
  Send,
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
  }, [toast]);

  const generateInvoicePDF = (info: ProviderBillingInfo, output: 'blob' | 'datauristring' = 'blob'): jsPDF => {
    const doc = new jsPDF();
    const invoiceDate = new Date();
    const invoiceId = `INV-${info.provider.uid.slice(-4)}-${invoiceDate.getTime()}`;

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('A+ Cleaning Solutions', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Company Address, City, Postal Code', 14, 30);
    doc.text('contact@apluscleaning.com', 14, 35);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(info.provider.name, 14, 56);
    doc.text(info.provider.email, 14, 62);

    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', 140, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceId}`, 140, 56);
    doc.text(`Date: ${invoiceDate.toLocaleDateString()}`, 140, 62);
    
    doc.autoTable({
        startY: 75,
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
        theme: 'striped',
        headStyles: { fillColor: [38, 117, 101] },
        footStyles: {
            fontStyle: 'bold',
            fillColor: [244, 244, 245],
            textColor: [10, 10, 10]
        },
        foot: [
          ['', '', '', { content: 'Total Payout Due:', styles: { halign: 'right' } }, { content: `$${info.totalPayoutDue.toFixed(2)}`, styles: { halign: 'right' } }]
        ]
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.text('Thank you for your partnership!', 14, finalY + 20);
    doc.text('Payment will be processed within 5-7 business days.', 14, finalY + 25);

    return doc;
  }


  const handlePreviewInvoice = (info: ProviderBillingInfo) => {
    const doc = generateInvoicePDF(info);
    doc.output('dataurlnewwindow');
    toast({ title: "Invoice Preview", description: `PDF invoice for ${info.provider.name} is ready for preview.` });
  }

  const handleSendAndPay = async (info: ProviderBillingInfo) => {
     setPayingProvider(info.provider.name);
     try {
        const doc = generateInvoicePDF(info);
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        
        // 1. Send the email with PDF attachment
        const emailResponse = await fetch('/api/send-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: info.provider.email,
                subject: `Your Invoice from A+ Cleaning Solutions`,
                html: `<p>Hello ${info.provider.name},</p><p>Please find your latest invoice attached to this email.</p><p>Best regards,<br/>A+ Cleaning Solutions</p>`,
                pdfAttachment: {
                    filename: `invoice-${info.provider.name}-${new Date().toISOString().split('T')[0]}.pdf`,
                    content: pdfBase64,
                }
            })
        });

        if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            throw new Error(errorData.message || "Failed to send invoice email.");
        }

        toast({ title: "Invoice Sent", description: `Invoice has been emailed to ${info.provider.name}.` });
        
        // 2. Mark the bookings as paid
        const providerRequest = invoiceRequests.find(req => req.providerName === info.provider.name);
        const paymentResponse = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                providerName: info.provider.name,
                bookingIds: info.unpaidBookings.map(b => b._id),
                amount: info.totalPayoutDue,
                paymentDate: new Date().toISOString(),
                invoiceRequestId: providerRequest?._id
            })
        });

        if (!paymentResponse.ok) {
            throw new Error("Payment processing failed after sending email.");
        }

        toast({
            title: "Payment Successful",
            description: `${info.provider.name} has been paid $${info.totalPayoutDue.toFixed(2)}.`,
        });
        
        // 3. Refresh data on success
        fetchBillingData();

     } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Action Failed',
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
                            onClick={() => handlePreviewInvoice(info)}
                            disabled={info.totalPayoutDue === 0}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Generate & Preview Invoice
                        </Button>
                        <Button 
                            size="lg" 
                            onClick={() => handleSendAndPay(info)}
                            disabled={info.totalPayoutDue === 0 || payingProvider !== null}
                        >
                          {payingProvider === info.provider.name ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Invoice
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

    