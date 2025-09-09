'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (oobCode) {
      handleVerifyEmail(oobCode);
    }
  }, [oobCode]);

  const handleVerifyEmail = async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      toast({
        title: 'Email Verified!',
        description: 'Your email has been successfully verified. You can now sign in.',
      });
      router.push('/sign-in');
    } catch (error) {
      console.error('Email verification error:', error);
      toast({
        variant: 'destructive',
        title: 'Email Verification Failed',
        description: 'The verification link is invalid or has expired. Please try signing up again.',
      });
    }
  };

  if (!oobCode) {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-lg">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Invalid Verification Link</CardTitle>
                    <CardDescription>
                       No verification code provided.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="text-center">
                     <Button asChild>
                         <Link href="/sign-in">Go to Sign In</Link>
                     </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-lg">
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Verifying Your Email...</CardTitle>
                <CardDescription>
                    Please wait while we verify your email address.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
