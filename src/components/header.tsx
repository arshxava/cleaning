
'use client';

import Link from 'next/link';
import { Menu, LogOut, Shield, Briefcase, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useSession } from '@/components/session-provider'; 
import { useToast } from '@/hooks/use-toast';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';


const navLinks = [
  { href: '/dashboard', label: 'Dashboard', roles: ['user'] },
  { href: '/book', label: 'Book a Cleaning', roles: ['user'] },
  { href: '/complaints', label: 'Submit Complaint', roles: ['user'] },
  { href: '/admin/complaints', label: 'Admin Dashboard', icon: Shield, roles: ['admin'] },
  { href: '/provider/dashboard', label: 'Provider Dashboard', icon: Briefcase, roles: ['provider'] },
];

const Header = () => {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { user, profile } = useSession();
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
  
  const getVisibleLinks = () => {
    if (!user || !profile) return [];
    return navLinks.filter(link => link.roles.includes(profile.role));
  }
  
  const visibleLinks = getVisibleLinks();


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center gap-2 font-bold text-lg">
          <Image src="/logo.png" alt="A+ Cleaning Solutions" width={150} height={40} />
        </Link>
        <nav className="hidden md:flex md:items-center md:gap-6 text-sm font-medium">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
           {user ? (
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/">Sign Up</Link>
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
            <SheetContent side="left" className="p-0">
               <SheetHeader className="p-6">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>A list of links to navigate the application.</SheetDescription>
                </VisuallyHidden>
              </SheetHeader>
              <div className="flex flex-col gap-6 px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={closeSheet}>
                  <Image src="/logo.png" alt="A+ Cleaning Solutions" width={150} height={40} />
                </Link>
                <nav className="flex flex-col gap-4">
                  {visibleLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      onClick={closeSheet}
                    >
                      {link.icon && <link.icon className="h-4 w-4" />}
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
