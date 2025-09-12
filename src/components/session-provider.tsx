
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
const authRoutes = ['/sign-in', '/sign-up', '/'];
const adminRoutePrefix = '/admin';
const providerRoutePrefix = '/provider';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Always start loading
  const router = useRouter();
  const pathname = usePathname();

  // Step 1: Listen for Firebase auth state changes and update the user.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // We initially set loading to true when the component mounts.
      // We will set it to false only after we've checked for a profile.
    });

    return () => unsubscribe();
  }, []);
  
  // Step 2: When the user state changes, fetch the corresponding profile from the DB.
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/users/${user.uid}`);
          if (response.ok) {
            const profileData: UserProfile = await response.json();
            setProfile(profileData);
          } else {
            // Profile not found in DB. This can happen if DB write fails after signup.
            // Sign the user out to force a clean slate.
            console.error("Profile not found for authenticated user, signing out.");
            await auth.signOut();
            setProfile(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user profile, signing out.", error);
          await auth.signOut();
          setProfile(null);
          setUser(null);
        } finally {
           setLoading(false);
        }
      } else {
        // No user, so we are done loading.
        setProfile(null);
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]); // This effect runs whenever the `user` object changes.

  // Step 3: Handle route protection and redirects based on loading, user, and profile state.
  useEffect(() => {
    if (loading) return; // Don't do anything while loading to prevent flicker

    const pathIsPublic = publicRoutes.some(route => pathname === route);

    if (!user && !pathIsPublic) {
      router.push('/sign-in');
      return;
    }

    if (user && profile) {
      const pathIsAuth = authRoutes.includes(pathname);
      const pathIsAdmin = pathname.startsWith(adminRoutePrefix);
      const pathIsProvider = pathname.startsWith(providerRoutePrefix);

      // If on an auth page (like sign-in), redirect to the correct dashboard
      if (pathIsAuth) {
        if (profile.role === 'admin') router.push('/admin/complaints');
        else if (profile.role === 'provider') router.push('/provider/dashboard');
        else router.push('/dashboard');
        return;
      }
      
      // Enforce role-based access
      if (pathIsAdmin && profile.role !== 'admin') {
        router.push('/dashboard'); 
      } else if (pathIsProvider && profile.role !== 'provider') {
        router.push('/dashboard');
      } else if (pathname.startsWith('/dashboard') && profile.role !== 'user') {
        // Redirect non-users away from the user dashboard
        if (profile.role === 'admin') router.push('/admin/complaints');
        else if (profile.role === 'provider') router.push('/provider/dashboard');
      }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading) {
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
