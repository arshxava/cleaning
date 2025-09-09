'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MessageSquare, Image as ImageIcon } from 'lucide-react';

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

const formSchema = z.object({
  complaint: z.string().min(10, 'Please provide at least 10 characters to describe the issue.'),
  image: z.any().optional(),
});

export default function ComplaintPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      complaint: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: 'Complaint Submitted',
      description: 'Thank you for your feedback. Your complaint has been sent to our support team and the service provider.',
    });
    form.reset();
  }

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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center'>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload an image (optional)
                    </FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg">
                Send Complaint
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
