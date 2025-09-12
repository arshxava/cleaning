
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        // If no firebase user, clear profile and stop loading.
        setProfile(null);
        setLoading(false);
      }
      // If there IS a firebase user, fetching profile will happen in the next useEffect
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true); // Set loading true before fetching profile
        try {
          const response = await fetch(`/api/users/${user.uid}`);
          if (response.ok) {
            const profileData: UserProfile = await response.json();
            setProfile(profileData);
          } else {
            // This is the critical failure point. A user exists in Firebase Auth, but not our DB.
            // It can occur if DB entry fails after signup.
            // Signing them out forces a clean slate.
            console.error("Profile not found for authenticated user, signing out.");
            await auth.signOut();
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error("Failed to fetch user profile, signing out.", error);
          await auth.signOut();
          setUser(null);
          setProfile(null);
        } finally {
           setLoading(false);
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  useEffect(() => {
    // This effect handles redirects based on session state.
    // It will only run when loading is false.
    if (loading) return; 

    const pathIsPublic = publicRoutes.some(route => pathname === route);

    // If not authenticated and on a private page, redirect to sign-in.
    if (!user && !pathIsPublic) {
      router.push('/sign-in');
      return;
    }

    // If authenticated and profile is loaded...
    if (user && profile) {
      const pathIsAuth = authRoutes.includes(pathname);
      const pathIsAdmin = pathname.startsWith(adminRoutePrefix);
      const pathIsProvider = pathname.startsWith(providerRoutePrefix);

      // If on an auth page (like sign-in), redirect to appropriate dashboard.
      if (pathIsAuth) {
        if (profile.role === 'admin') router.push('/admin/complaints');
        else if (profile.role === 'provider') router.push('/provider/dashboard');
        else router.push('/dashboard');
        return;
      }
      
      // Enforce role-based access control.
      if (pathIsAdmin && profile.role !== 'admin') {
        router.push('/dashboard'); 
      } else if (pathIsProvider && profile.role !== 'provider') {
        router.push('/dashboard');
      } else if (pathname.startsWith('/dashboard') && profile.role !== 'user') {
        // If a non-user tries to access the user dashboard, redirect them.
        if (profile.role === 'admin') router.push('/admin/complaints');
        else if (profile.role === 'provider') router.push('/provider/dashboard');
      }
    }
  }, [user, profile, loading, router, pathname]);
  
  // While loading, we prevent any rendering of protected routes to avoid flashes of content.
  const pathIsPublic = publicRoutes.some(route => pathname === route);
  if (loading && !pathIsPublic) {
    // Return a full-page skeleton loader for a better user experience on protected routes.
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

  // Once loading is complete, render the children.
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
