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
  const [loading, setLoading] = useState(true); // This now represents the combined loading state of auth and profile
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Start loading whenever auth state changes
      if (firebaseUser) {
        if (!firebaseUser.emailVerified && pathname !== '/verify-email') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          setUser(firebaseUser);
          try {
            const response = await fetch(`/api/users/${firebaseUser.uid}`);
            if (response.ok) {
              const profileData = await response.json();
              setProfile(profileData);
            } else {
              setProfile(null);
            }
          } catch (e) {
            setProfile(null);
            console.error("Failed to fetch user profile", e);
          } finally {
            setLoading(false); // Stop loading once user and profile are processed
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false); // Stop loading if no user
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  useEffect(() => {
    // Don't do anything until auth state and profile fetch are fully resolved
    if (loading) return; 

    const pathIsPublic = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)));
    const pathIsAdmin = pathname.startsWith(adminRoutePrefix);

    if (!user && !pathIsPublic) {
      router.push('/sign-in');
      return;
    }

    if (user) {
      // If user is on an auth page, redirect them away
      if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
        if (profile?.role === 'admin') {
          router.push('/admin/complaints');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      
      // If user is on an admin route but is not an admin, redirect
      if (pathIsAdmin && profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, router, pathname]);

  // Show a loading skeleton on protected routes while the session is being established.
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  if (loading && !isAuthPage && !publicRoutes.includes(pathname)) {
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
