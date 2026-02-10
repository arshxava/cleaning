'use client';

import Link from 'next/link';
import { Menu, LogOut, Shield, Briefcase, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const [showTerms, setShowTerms] = useState(false);

  // ✅ TERMS CONTENT (ADDED)
  const [termsContent, setTermsContent] = useState('');

  const { user, profile } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  // ✅ FETCH TERMS FROM ADMIN SETTINGS (ADDED)
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch('/api/settings/terms');
        if (res.ok) {
          const data = await res.json();
          setTermsContent(data.content || '');
        }
      } catch (error) {
        console.error('Failed to fetch terms:', error);
      }
    };

    fetchTerms();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: "You've been successfully signed out.",
      });
      router.push('/sign-in');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'There was a problem signing you out.',
      });
    }
  };

  const visibleLinks =
    user && profile
      ? navLinks.filter(link => link.roles.includes(profile.role))
      : [];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
          {/* LOGO */}
          <a
  href="https://aplus-cleaning-solutions.com/"
  target="_blank"
  rel="noopener noreferrer"
  className="mr-6 flex items-center gap-2"
>
  <img
    src="https://testingwebsitedesign.com/aplus-cleaning/wp-content/uploads/2026/01/ChatGPT_Imsd.png"
    alt="A+ Cleaning Solutions"
    className="h-12"
  />
</a>
          {/* DESKTOP NAV */}
          <nav className="hidden md:flex md:items-center md:gap-6 text-sm font-medium">
            {visibleLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="ml-auto flex items-center gap-4">
            {user && profile?.role === 'user' && (
              <button
                onClick={() => setShowTerms(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Terms & Conditions
              </button>
            )}

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

            {/* MOBILE MENU */}
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="p-0">
                <SheetHeader className="p-6">
                  <VisuallyHidden>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>Menu</SheetDescription>
                  </VisuallyHidden>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-lg"
                    onClick={() => setSheetOpen(false)}
                  >
                    <Sparkles className="h-6 w-6 text-primary" />
                    A+ Cleaning Solutions
                  </Link>

                  <nav className="flex flex-col gap-4">
                    {visibleLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setSheetOpen(false)}
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

      {/* ✅ TERMS & CONDITIONS POPUP */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Terms & Conditions</DialogTitle>
          </DialogHeader>

          {/* ✅ DYNAMIC TERMS CONTENT */}
          {/* <div
            className="max-h-[300px] overflow-y-auto space-y-4 text-sm"
            dangerouslySetInnerHTML={{ __html: termsContent }}
          />

<div className="max-h-[300px] overflow-y-auto whitespace-pre-line text-sm text-gray-700">
  {termsContent}
</div> */}
<div
  className="
    max-h-[300px]
    overflow-y-auto
    prose
    prose-sm
    prose-gray
    prose-p:my-3
    prose-li:my-1
  "
  dangerouslySetInnerHTML={{ __html: termsContent }}
/>

          <DialogFooter>
            <Button onClick={() => setShowTerms(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
