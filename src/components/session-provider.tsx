'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import type { UserProfile } from '@/lib/types';

interface SessionContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const publicRoutes = ['/sign-in', '/sign-up', '/verify-email', '/'];
const adminRoutePrefix = '/admin';
const providerRoutePrefix = '/provider';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Always set the Firebase user first
        setUser(firebaseUser);
        try {
          const response = await fetch(`/api/users/${firebaseUser.uid}`);
          if (response.ok) {
            const profileData: UserProfile = await response.json();
            setProfile(profileData);
          } else {
            setProfile(null); // Explicitly set to null if profile not found
          }
        } catch (e) {
          console.error("Failed to fetch user profile", e);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Run only once on mount

  useEffect(() => {
    if (loading) return; 

    const pathIsPublic = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)));
    const pathIsAdmin = pathname.startsWith(adminRoutePrefix);
    const pathIsProvider = pathname.startsWith(providerRoutePrefix);

    // If user is not logged in and the route is not public, redirect to sign-in
    if (!user && !pathIsPublic) {
      router.push('/sign-in');
      return;
    }

    // If user is logged in, but profile is still loading, do nothing yet.
    if (user && !profile) {
      // It's possible the profile is still being fetched. We wait.
      // A timeout could be added here to handle profiles that never load.
      return;
    }

    if (user && profile) {
      // If user is on an auth page, redirect them to their dashboard
      if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
        if (profile.role === 'admin') {
          router.push('/admin/complaints');
        } else if (profile.role === 'provider') {
          router.push('/provider/dashboard');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      
      // Enforce role-based access
      if (pathIsAdmin && profile.role !== 'admin') {
        router.push('/dashboard'); // or a specific unauthorized page
        return;
      }
      
      if (pathIsProvider && profile.role !== 'provider') {
        router.push('/dashboard'); // or a specific unauthorized page
        return;
      }

      if (profile.role === 'user' && (pathIsAdmin || pathIsProvider)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, router, pathname]);

  // Show a loading skeleton for protected routes while the session is being verified.
  if (loading && !publicRoutes.includes(pathname)) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                 <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
                    <Skeleton className="h-8 w-32" />
                    <div className="ml-auto flex items-center gap-4">
                        <Skeleton className="h-8 w-20" />
                    </div>
                </div>
            </header>
            <main className="flex-grow">
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-1/4" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </main>
        </div>
    );
  }

  return (
    <SessionContext.Provider value={{ user, profile, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
