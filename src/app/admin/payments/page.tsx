
'use client';

import { useEffect, useState } from 'react';
import {
  Download,
  Loader2,
  Receipt,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import type { Payment, Booking } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Button } from '@/components/ui/button';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        const [paymentsRes, bookingsRes] = await Promise.all([
          fetch('/api/payments'),
          fetch('/api/bookings'),
        ]);

        if (!paymentsRes.ok) throw new Error('Failed to fetch payments');
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
        
        if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch payment data.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [toast]);
  
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

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Payment History
        </h1>
        <p className="text-muted-foreground mt-2">
          Review all historical payment transactions made to service providers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="w-full h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead># Services Paid</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (
                  payments.map(payment => (
                    <TableRow key={payment._id}>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{payment.providerName}</TableCell>
                      <TableCell>{payment.bookingIds.length}</TableCell>
                      <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                         <Button variant="outline" size="sm" onClick={() => generateInvoice(payment)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No payments have been made yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
