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
        if (!firebaseUser.emailVerified && pathname !== '/verify-email' && !pathname.startsWith('/sign-in')) {
          setUser(null);
          setProfile(null);
          setLoading(false);
           // Optional: You might want to redirect to sign-in if an unverified user tries to access other pages.
           // router.push('/sign-in');
        } else {
          setUser(firebaseUser);
          try {
            const response = await fetch(`/api/users/${firebaseUser.uid}`);
            if (response.ok) {
              const profileData: UserProfile = await response.json();
              setProfile(profileData);
            } else {
              // This can happen if the user exists in Firebase Auth but not in your MongoDB collection.
              // For example, a provider who was just created but profile not saved yet.
              // We'll set profile to a base object to avoid routing errors.
              setProfile({
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email!,
                role: 'user', // Default role
              } as UserProfile);
            }
          } catch (e) {
            setProfile(null);
            console.error("Failed to fetch user profile", e);
          } finally {
            setLoading(false);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  useEffect(() => {
    if (loading) return; 

    const pathIsPublic = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route) && route !== '/verify-email'));
    const pathIsAdmin = pathname.startsWith(adminRoutePrefix);
    const pathIsProvider = pathname.startsWith(providerRoutePrefix);

    if (!user && !pathIsPublic) {
      router.push('/sign-in');
      return;
    }

    if (user && profile) {
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
      
      if (pathIsAdmin && profile.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      if (pathIsProvider && profile.role !== 'provider') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, router, pathname]);

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
