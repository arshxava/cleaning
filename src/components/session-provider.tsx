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

const publicRoutes = ['/sign-in', '/sign-up', '/verify-email'];
const adminRoutePrefix = '/admin';


export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        if (!user.emailVerified && pathname !== '/verify-email') {
            setUser(null);
            setProfile(null);
        } else {
             setUser(user);
             try {
                const response = await fetch(`/api/users/${user.uid}`);
                if (response.ok) {
                  const profileData = await response.json();
                  setProfile(profileData);
                } else {
                  setProfile(null);
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
    if (loading) return;

    const pathIsPublic = publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
    const pathIsAdmin = pathname.startsWith(adminRoutePrefix);

    if (pathIsAdmin && profile?.role !== 'admin') {
       router.push('/dashboard');
       return;
    }

    if (!user && !pathIsPublic) {
      router.push('/sign-in');
    } else if (user && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      if (profile?.role === 'admin') {
        router.push('/admin/complaints');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading) {
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
