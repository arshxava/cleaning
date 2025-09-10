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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.emailVerified && pathname !== '/verify-email') {
          setUser(null);
          setProfile(null);
        } else {
          setUser(firebaseUser);
          try {
            const response = await fetch(`/api/users/${firebaseUser.uid}`);
            if (response.ok) {
              const profileData = await response.json();
              setProfile(profileData);
            } else {
              setProfile(null); // Explicitly set profile to null if fetch fails
            }
          } catch (e) {
            setProfile(null);
            console.error("Failed to fetch user profile", e);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  useEffect(() => {
    if (loading) return; // Don't do anything until auth state is resolved

    const pathIsPublic = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)));
    const pathIsAdmin = pathname.startsWith(adminRoutePrefix);

    // If there's no user and the path is not public, redirect to sign-in
    if (!user && !pathIsPublic) {
      router.push('/sign-in');
      return;
    }

    if (user) {
      // If there is a user, and we have their profile
      if (profile) {
        // If they are on an admin route but are not an admin, redirect
        if (pathIsAdmin && profile.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        // If they are on a sign-in/sign-up page, redirect them to their respective dashboard
        if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
          if (profile.role === 'admin') {
            router.push('/admin/complaints');
          } else {
            router.push('/dashboard');
          }
          return;
        }
      } else if (!pathIsPublic && pathname !== '/verify-email') {
         // If user exists but profile fetch failed or is pending, and we are not on a public page
         // This can happen briefly. For now, we assume they are a regular user if profile is missing.
         // If they land on an auth page, redirect to dashboard.
        if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
            router.push('/dashboard');
        }
      }
    }
  }, [user, profile, loading, router, pathname]);

  // Show a loading skeleton while the session is being established.
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  if (loading && !isAuthPage) {
    return (
        <div className="container mx-auto p-4">
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/4" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
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
