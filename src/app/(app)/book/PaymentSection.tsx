'use client';

import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PaymentSection({
  booking,
  bookingPayload,
  onSuccess,
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements || isLoading) return;

    if (!bookingPayload.email) {
      toast({
        variant: "destructive",
        title: "Missing email",
        description: "User email is required to confirm booking.",
      });
      return;
    }

    try {
      setIsLoading(true);

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
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Review Your Booking</h3>

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
            <span className="float-right font-bold">
              {new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
              }).format(booking.price)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stripe UI */}
      <div className="border rounded-md p-4">
        <PaymentElement />
      </div>

      {/* Pay Button with Loader */}
      <Button
        onClick={handlePay}
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing payment...
          </span>
        ) : (
          "Pay & Confirm Booking"
        )}
      </Button>
    </div>
  );
}
