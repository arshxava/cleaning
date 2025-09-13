
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';

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
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function SignInPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Fetch user profile to check role
      const response = await fetch(`/api/users/${user.uid}`);
      
      // If the profile doesn't exist or fetch fails, they are a regular user.
      if (!response.ok) {
        // This case might apply to users created before the profile system, or if the API is down.
        // Defaulting to user dashboard.
        toast({
          title: 'Signed In Successfully!',
          description: "Welcome back! Redirecting to your dashboard.",
        });
        router.push('/dashboard');
        return;
      }
      
      const profile: UserProfile = await response.json();

      toast({
        title: 'Signed In Successfully!',
        description: `Welcome, ${profile.name}! You're now logged in.`,
      });

      if (profile?.role === 'admin') {
        router.push('/admin/complaints');
      } else if (profile?.role === 'provider') {
        router.push('/provider/dashboard');
      } else {
        router.push('/dashboard');
      }

    } catch (error: any) {
      console.error('Authentication error:', error);
       let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-disabled') {
         description = 'This account has been disabled.'
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description,
      });
    }
  }

  return (
     <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold font-headline">Welcome Back</h1>
                <p className="text-balance text-muted-foreground">
                    Sign in to your A+ Cleaning Solutions account to continue.
                </p>
            </div>
             {mode === 'resetPassword' && (
                <Alert className="bg-green-50 border-green-200">
                <AlertTitle className="text-green-800">Password Reset Successful</AlertTitle>
                <AlertDescription className="text-green-700">
                    You can now sign in with your new password.
                </AlertDescription>
                </Alert>
            )}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                type="email"
                                placeholder="you@university.edu"
                                {...field}
                                className="pl-10"
                                />
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
                                <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                                className="pl-10"
                                />
                            </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
            </Form>
            <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <Link href="/" className="underline">
                Sign Up
                </Link>
            </div>
        </div>
    </div>
  );
}
