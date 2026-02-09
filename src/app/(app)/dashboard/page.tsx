'use client';

import Link from 'next/link';
import {
  User,
  Calendar,
  Clock,
  Sparkles,
  MessageSquareWarning,
  PlusCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/components/session-provider';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Booking, Complaint } from '@/lib/types';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function DashboardPage() {
  const { user, profile } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ TERMS POPUP STATE
  const [showTerms, setShowTerms] = useState(false);

  // ✅ TERMS CONTENT (ADDED)
  const [termsContent, setTermsContent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [bookingsRes, complaintsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/complaints'),
        ]);

        if (bookingsRes.ok) {
          const allBookings = await bookingsRes.json();
          setBookings(allBookings.filter((b: Booking) => b.userId === user.uid));
        }

        if (complaintsRes.ok) {
          const allComplaints = await complaintsRes.json();
          setComplaints(allComplaints.filter((c: any) => c.userId === user.uid));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  // ✅ SHOW TERMS ONLY WHEN REDIRECTED FROM LOGIN
  useEffect(() => {
    const shouldShow = sessionStorage.getItem('showTerms');
    if (shouldShow === 'true') {
      setShowTerms(true);
      sessionStorage.removeItem('showTerms');
    }
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <>
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">
            Welcome back, {profile.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here’s an overview of your A+ Cleaning Solutions account.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={'/images/avatar-placeholder.png'} />
                  <AvatarFallback>
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="font-headline text-2xl">
                    {profile.name || 'User'}
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Role:</span>
                  <Badge
                    variant={
                      profile.role === 'admin'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {profile.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* BOOKINGS */}
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <CardTitle className="mb-0 text-2xl font-headline">
                    My Bookings
                  </CardTitle>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/book">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Booking
                  </Link>
                </Button>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center text-muted-foreground bg-slate-50 py-8 rounded-md">
                    <p className="mb-4">
                      You have no upcoming or past bookings.
                    </p>
                    <Button asChild>
                      <Link href="/book">Book Your First Cleaning</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {bookings.map(booking => (
                      <Card key={booking._id} className="flex flex-col">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-headline flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              {booking.service}
                            </CardTitle>
                            <Badge
                              variant={
                                booking.status === 'Completed'
                                  ? 'outline'
                                  : 'default'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            {booking.building}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(booking.date).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                month: 'long',
                                day: 'numeric',
                                timeZone: 'UTC',
                              }
                            )}
                          </p>
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {booking.time}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* COMPLAINTS */}
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <MessageSquareWarning className="w-6 h-6 text-destructive" />
                  <CardTitle className="mb-0 text-2xl font-headline">
                    My Complaints
                  </CardTitle>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/complaints">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Complaint
                  </Link>
                </Button>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : complaints.length === 0 ? (
                  <div className="text-center text-muted-foreground bg-slate-50 py-8 rounded-md">
                    <p className="mb-4">
                      You have no submitted complaints.
                    </p>
                    <Button asChild variant="secondary">
                      <Link href="/complaints">Submit a Complaint</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {complaints.map(complaint => (
                      <li
                        key={complaint._id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold truncate max-w-md">
                            {complaint.complaint}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Submitted on{' '}
                            {new Date(
                              complaint.date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            complaint.status === 'Pending'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {complaint.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ✅ TERMS & CONDITIONS POPUP */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Terms & Conditions</DialogTitle>
          </DialogHeader>

          {/* ✅ DYNAMIC TERMS CONTENT (REPLACED HARD-CODED TEXT) */}
          {/* <div
            className="max-h-[300px] overflow-y-auto space-y-4 text-sm"
            dangerouslySetInnerHTML={{ __html: termsContent }}
          /> */}

          <div className="max-h-[300px] overflow-y-auto whitespace-pre-line text-sm text-gray-700">
            {termsContent}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTerms(false)}>
              Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
