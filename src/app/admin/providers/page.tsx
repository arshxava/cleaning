
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Building,
  Phone,
  HardHat,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
});

type ProviderProfile = UserProfile & { role: 'provider' };

export default function ProvidersPage() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users'); // Fetch all users
      if (!response.ok) throw new Error('Failed to fetch providers');
      const allUsers: UserProfile[] = await response.json();
      // Filter for providers
      const providerUsers = allUsers.filter(user => user.role === 'provider') as ProviderProfile[];
      setProviders(providerUsers);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch service providers.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // NOTE: In a real app, you'd likely create the user via a more secure admin SDK on the backend.
      // This client-side creation is for demonstration purposes.
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const providerData = {
        uid: user.uid,
        ...values,
        role: 'provider',
        notificationPreference: 'email', // default
        school: 'N/A', // default
        roomSize: 'N/A', // default
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData),
      });

      if (!response.ok) {
        throw new Error('Failed to save provider data.');
      }

      toast({
        title: 'Provider Account Created',
        description: `An account for ${values.name} has been created. Please share their login credentials with them securely.`,
      });
      form.reset();
      fetchProviders();

    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already in use by another account.';
      }
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description,
      });
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Service Providers
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your cleaning service providers.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create Provider Account</CardTitle>
              <CardDescription>
                Add a new service provider to the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider/Company Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <HardHat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="e.g., Quality First Sparkle" {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="email" placeholder="contact@qfs.com" {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temporary Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="tel" placeholder="(555) 123-4567" {...field} className="pl-10" />
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Providers</CardTitle>
              <CardDescription>
                A list of all service providers in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : providers.length > 0 ? (
                  providers.map((provider) => (
                    <div
                      key={provider.uid}
                      className="flex items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{provider.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3" /> {provider.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="h-3 w-3" /> {provider.phone}
                        </p>
                         <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                           <CalendarIcon className="h-3 w-3" /> Joined on{' '}
                           {new Date(provider.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground bg-slate-50 py-8 rounded-md">
                    <p>No service providers have been added yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
