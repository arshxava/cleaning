'use client';

import Link from 'next/link';
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  MessageSquareWarning,
  ChevronRight,
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

const bookings = [
  {
    id: 'B-789',
    service: 'Standard Clean',
    date: '2024-08-15T10:00:00Z',
    status: 'Upcoming',
  },
  {
    id: 'B-788',
    service: 'Deep Clean',
    date: '2024-07-15T10:00:00Z',
    status: 'Completed',
  },
];

const complaints = [
  {
    id: 'C-101',
    subject: 'Incomplete Cleaning',
    date: '2024-07-28T10:00:00Z',
    status: 'Pending',
  },
];

export default function DashboardPage() {
  const { user } = useSession();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Welcome back, {user.displayName || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Here’s an overview of your Campus Clean account.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.photoURL || `https://i.pravatar.cc/80?u=${user.uid}`} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-headline text-2xl">{user.displayName || 'Anonymous User'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
               <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{'Chestnut Residence'}</span>
                </div>
              <Button variant="outline" className="w-full mt-2">Edit Profile</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div className='flex items-center gap-3'>
                <Calendar className="w-6 h-6 text-primary" />
                <CardTitle className='mb-0 text-2xl font-headline'>My Bookings</CardTitle>
              </div>
               <Button asChild variant="secondary" size="sm">
                <Link href="/book">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Booking
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {bookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {booking.service}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                         <Clock className="w-4 h-4" />
                        {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                     <Badge variant={booking.status === 'Upcoming' ? 'default' : 'outline'}>
                        {booking.status}
                     </Badge>
                  </li>
                ))}
                 {bookings.length === 0 && (
                        <p className='text-sm text-center text-muted-foreground bg-slate-50 py-8 rounded-md'>You have no upcoming or past bookings.</p>
                    )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                 <div className='flex items-center gap-3'>
                    <MessageSquareWarning className="w-6 h-6 text-destructive" />
                    <CardTitle className='mb-0 text-2xl font-headline'>My Complaints</CardTitle>
                </div>
                 <Button asChild variant="secondary" size="sm">
                    <Link href="/complaints">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Complaint
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {complaints.map((complaint) => (
                    <li
                        key={complaint.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                    >
                        <div className="space-y-1">
                            <p className="font-semibold">
                                {complaint.subject}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Submitted on {new Date(complaint.date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="destructive">{complaint.status}</Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </li>
                    ))}
                    {complaints.length === 0 && (
                        <p className='text-sm text-center text-muted-foreground bg-slate-50 py-8 rounded-md'>You have no submitted complaints.</p>
                    )}
                </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
