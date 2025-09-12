
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Building as BuildingIcon,
  Phone,
  HardHat,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Lock,
  Percent,
} from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  commissionPercentage: z.coerce.number().min(0).max(100, 'Commission must be between 0 and 100.'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProviderProfile = UserProfile & { role: 'provider' };
type Building = { _id: string; name: string; location: string };

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
      confirmPassword: '',
      phone: '',
      commissionPercentage: 10,
    },
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const providersRes = await fetch('/api/users');

      if (!providersRes.ok) throw new Error('Failed to fetch providers');
      const allUsers: UserProfile[] = await providersRes.json();
      const providerUsers = allUsers.filter(user => user.role === 'provider') as ProviderProfile[];
      setProviders(providerUsers);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch page data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Omit `confirmPassword` before sending to the backend
      const { confirmPassword, ...dataToSend } = values;

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataToSend, role: 'provider' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create provider.');
      }
      
      toast({
        title: 'Provider Account Created',
        description: `An account has been created for ${values.name}.`,
      });
      form.reset();
      fetchInitialData(); // Refresh the list

    } catch (error: any) {
      let description = error.message || 'An unexpected error occurred.';
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
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
                   <FormField
                    control={form.control}
                    name="commissionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Percentage</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="e.g. 10" {...field} className="pl-10" />
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
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : providers.length > 0 ? (
                  providers.map((provider) => (
                    <div
                      key={provider.uid}
                      className="flex flex-col items-start justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="w-full">
                        <div className='flex justify-between w-full'>
                            <div>
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
