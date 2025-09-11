
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
            // This happens if the user exists in Firebase Auth but not in the DB.
            // It can occur if DB entry fails after signup.
            // Signing them out forces a clean slate.
            console.error("Profile not found for authenticated user, signing out.");
            await auth.signOut();
            setUser(null);
            setProfile(null);
            // No need to redirect here, the other effect will handle it.
          }
        } catch (e) {
          console.error("Failed to fetch user profile", e);
          // Sign out if profile fetch fails catastrophically
          await auth.signOut();
          setUser(null);
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

    const pathIsPublic = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route) && route !== '/verify-email' && pathname !== '/sign-in' && pathname !== '/sign-up'));
    const pathIsAuthRoute = pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/';

    
    // If user is not logged in and trying to access a protected route, redirect to sign-in
    if (!user && !pathIsPublic) {
      router.push('/sign-in');
      return;
    }

    if (user && profile) {
      // If a logged-in user tries to access auth pages, redirect them to their dashboard
      if (pathIsAuthRoute) {
        if (profile.role === 'admin') {
          router.push('/admin/complaints');
        } else if (profile.role === 'provider') {
          router.push('/provider/dashboard');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      
      const pathIsAdmin = pathname.startsWith(adminRoutePrefix);
      const pathIsProvider = pathname.startsWith(providerRoutePrefix);

      // Enforce role-based access
      if (pathIsAdmin && profile.role !== 'admin') {
        router.push('/dashboard'); 
      } else if (pathIsProvider && profile.role !== 'provider') {
        router.push('/dashboard');
      } else if (profile.role === 'user' && (pathIsAdmin || pathIsProvider)) {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router, pathname]);

  // Determine if the current route is a protected route.
  const isProtectedRoute = !publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route) && route !== '/verify-email' && pathname !== '/sign-in' && pathname !== '/sign-up'));

  // Show a loading skeleton for protected routes while the session is being verified.
  if (loading && isProtectedRoute) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                 <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
                    <Skeleton className="h-8 w-48" />
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
