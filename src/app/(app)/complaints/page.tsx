
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MessageSquare, Image as ImageIcon, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { useSession } from '@/components/session-provider';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Booking } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  bookingId: z.string().optional(),
  complaintType: z.enum(['damage', 'service_quality'], {
    required_error: 'Please select the type of complaint.',
  }),
  complaint: z.string().min(10, 'Please provide at least 10 characters to describe the issue.'),
  image: z.instanceof(File).optional(),
});

export default function ComplaintPage() {
  const { toast } = useToast();
  const { user, profile } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      setLoadingBookings(true);
      try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
          const allBookings: Booking[] = await res.json();
          setBookings(allBookings.filter(b => b.userId === user.uid));
        }
      } catch (error) {
        console.error("Failed to fetch bookings for complaints:", error);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      complaint: '',
    },
  });
  
  const getSignature = async (paramsToSign: Record<string, any>) => {
    const response = await fetch('/api/cloudinary/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paramsToSign }),
    });
    const { signature } = await response.json();
    return signature;
  };

  const uploadImageToCloudinary = async (file: File) => {
      setIsUploading(true);
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      const paramsToSign = { timestamp };
      const signature = await getSignature(paramsToSign);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);

      const endpoint = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
      
      try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Image upload failed.');
        
        const data = await response.json();
        return data.secure_url;
      } finally {
        setIsUploading(false);
      }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a complaint.',
      });
      return;
    }

    try {
      let imageUrl: string | undefined = undefined;
      if (values.image) {
        toast({ title: 'Uploading Image...', description: 'Please wait while we upload your image.' });
        imageUrl = await uploadImageToCloudinary(values.image);
      }

      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: values.bookingId,
          complaintType: values.complaintType,
          complaint: values.complaint,
          imageUrl: imageUrl,
          userId: user.uid,
          user: profile.name,
          building: profile.school,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit complaint.');
      }

      toast({
        title: 'Complaint Submitted',
        description: 'Thank you for your feedback. Your complaint has been sent to our support team and the service provider.',
      });
      form.reset();
    } catch (error) {
      console.error('Complaint submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  }
  
  const isSubmitting = form.formState.isSubmitting || isUploading;

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Submit a Complaint</CardTitle>
          <CardDescription>
            We're sorry you had a problem. Please let us know what went wrong.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <FormField
                control={form.control}
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center'>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Related Booking (Optional)
                    </FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingBookings || bookings.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingBookings ? "Loading your bookings..." : "Select a booking..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bookings.length === 0 && !loadingBookings ? (
                           <SelectItem value="none" disabled>You have no bookings.</SelectItem>
                        ) : (
                           bookings.map(booking => (
                            <SelectItem key={booking._id} value={booking._id}>
                              {booking.service} on {new Date(booking.date).toLocaleDateString('en-CA', { timeZone: 'UTC' })}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                     Select the booking this complaint is related to, if applicable.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complaintType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center'>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Type of Complaint
                    </FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the nature of your issue..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                           <SelectItem value="service_quality">Unsatisfactory Service</SelectItem>
                           <SelectItem value="damage">Breakage or Damage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                     This helps us route your complaint to the right team.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center'>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Describe the issue
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., The cleaner missed a spot under the bed, or there was a delay..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your complaint will be sent to our admin team and the cleaning service provider simultaneously.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel className='flex items-center'>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload an image (optional)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                 {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? 'Uploading...' : 'Submitting...'}
                    </>
                  ) : 'Send Complaint'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
