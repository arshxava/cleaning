
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/session-provider';
import { BookingCard, Booking } from '@/components/booking-card';

const mockBookings: Booking[] = [
  {
    id: '1',
    user: 'Alice Johnson',
    building: 'Chestnut Residence',
    roomType: 'Single Dorm',
    service: 'Deep Clean',
    date: '2024-08-15',
    status: 'Aligned',
    provider: 'Quality First Sparkle',
  },
  {
    id: '2',
    user: 'Bob Williams',
    building: 'Place Vanier',
    roomType: 'Double Dorm',
    service: 'Standard Clean',
    date: '2024-08-16',
    status: 'In Process',
    provider: 'CleanSweep Inc.',
    beforeImage: 'https://picsum.photos/seed/before1/600/400',
  },
  {
    id: '3',
    user: 'Charlie Brown',
    building: 'Royal Victoria College',
    roomType: 'Bachelor Apartment',
    service: 'Move-Out Clean',
    date: '2024-08-12',
    status: 'Completed',
    provider: 'Quality First Sparkle',
    beforeImage: 'https://picsum.photos/seed/before2/600/400',
    afterImage: 'https://picsum.photos/seed/after2/600/400',
  },
   {
    id: '4',
    user: 'Diana Prince',
    building: 'Chestnut Residence',
    roomType: 'Single Dorm',
    service: 'Standard Clean',
    date: '2024-08-18',
    status: 'Aligned',
    provider: 'CleanSweep Inc.',
  },
];


export default function ProviderDashboardPage() {
  const { profile } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // and filter by the current provider's name or ID.
    if (profile) {
        const providerName = profile.name; // e.g., 'Quality First Sparkle'
        const assignedBookings = mockBookings.filter(b => b.provider === providerName);
        setBookings(assignedBookings);
    }
    setLoading(false);
  }, [profile]);
  
  const columns: Booking['status'][] = ['Aligned', 'In Process', 'Completed'];

  if (!profile) {
    return <p>Loading provider profile...</p>
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          {profile.name} Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Here are your assigned cleaning jobs.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {loading ? (
            columns.map(status => (
                <div key={status} className="space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ))
        ) : (
            columns.map(status => (
              <div key={status} className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {status}
                  <Badge variant="secondary" className="h-6">{bookings.filter(b => b.status === status).length}</Badge>
                </h2>
                <div className="space-y-4">
                  {bookings
                    .filter(b => b.status === status)
                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(booking => (
                      <BookingCard key={booking.id} booking={booking} userRole="provider" />
                  ))}
                   {bookings.filter(b => b.status === status).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No jobs in this stage.</p>
                   )}
                </div>
              </div>
            ))
        )}
      </div>

    </div>
  );
}
