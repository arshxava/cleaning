'use client';

import { z } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  content: z.string().min(10, 'Terms must be at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function AdminTermsPage() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: '' },
  });

  // Load existing terms
  useEffect(() => {
    fetch('/api/settings/terms')
      .then(res => res.json())
      .then(data => {
        form.reset({ content: data?.content || '' });
      });
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    const res = await fetch('/api/settings/terms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      toast({ title: 'Terms updated successfully' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Conditions</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={14}
                      placeholder="Enter terms and conditions..."
                      {...field}
                    />
                  </FormControl>

                  {/* Helper text */}
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters required.
                  </p>

                  {/* Validation error */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Save</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
