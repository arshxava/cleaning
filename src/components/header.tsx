'use client';

import Link from 'next/link';
import { Menu, Sparkles, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useSession } from '@/components/session-provider'; 
import { useToast } from '@/hooks/use-toast';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', protected: true },
  { href: '/book', label: 'Book a Cleaning', protected: true },
  { href: '/complaints', label: 'Submit Complaint', protected: true },
];

const Header = () => {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { user } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: "You've been successfully signed out.",
      });
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'There was a problem signing you out. Please try again.',
      });
    }
  };


  const closeSheet = () => setSheetOpen(false);
  
  const visibleLinks = navLinks.filter(link => !link.protected || (link.protected && user));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="hidden font-bold font-headline sm:inline-block text-lg">
            Campus Clean
          </span>
        </Link>
        <nav className="hidden md:flex md:items-center md:gap-6 text-sm font-medium">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
           {user ? (
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2" />
              Sign Out
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-6 p-6">
                <Link href="/" className="flex items-center gap-2" onClick={closeSheet}>
                  <Sparkles className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline text-lg">
                    Campus Clean
                  </span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {visibleLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={closeSheet}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
