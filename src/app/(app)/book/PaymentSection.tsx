'use client';

import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSection({
  booking,
  bookingPayload,
  onSuccess,
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handlePay = async () => {
    if (!stripe || !elements) return;
  
    // ✅ EMAIL VALIDATION — ADD HERE
    if (!bookingPayload.email) {
      toast({
        variant: "destructive",
        title: "Missing email",
        description: "User email is required to confirm booking.",
      });
      return;
    }
  
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
  
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: result.error.message,
      });
      return;
    }
  
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...bookingPayload,
        paymentIntentId: result.paymentIntent.id,
      }),
    });
  
    toast({
      title: "Booking Confirmed 🎉",
      description: "Payment successful",
    });
  
    onSuccess();
  };
  

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Review Your Booking</h3>

      {/* ✅ SAME CARD YOU ALREADY HAD */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between col-span-2">
            <span>Building:</span>
            <span>{booking.building}</span>
          </div>

          <div className="flex justify-between">
            <span>Apt Type:</span>
            <span>{booking.apartmentType}</span>
          </div>

          <div className="flex justify-between">
            <span>Apt No:</span>
            <span>{booking.apartmentNumber}</span>
          </div>

          <div className="col-span-2 border-t pt-4">
            <span>Total:</span>
            <span className="float-right font-bold">${booking.price}</span>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Stripe UI */}
      <div className="border rounded-md p-4">
        <PaymentElement />
      </div>

      {/* ✅ Confirm button now lives HERE */}
      <Button onClick={handlePay} className="w-full">
        Pay & Confirm Booking
      </Button>
    </div>
  );
}
