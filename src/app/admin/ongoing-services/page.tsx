
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
    beforeImages: [],
    afterImages: [],
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
    beforeImages: ['https://picsum.photos/seed/before1/600/400'],
    afterImages: [],
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
    beforeImages: ['https://picsum.photos/seed/before2/600/400', 'https://picsum.photos/seed/before3/600/400'],
    afterImages: ['https://picsum.photos/seed/after2/600/400'],
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
    beforeImages: [],
    afterImages: [],
  },
];


export default function OngoingServicesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    setBookings(mockBookings);
    setLoading(false);
  }, []);

  const columns: Booking['status'][] = ['Aligned', 'In Process', 'Completed'];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Ongoing Services
        </h1>
        <p className="text-muted-foreground mt-2">
          Track the status of all cleaning jobs from booking to completion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {loading ? (
            columns.map(status => (
                <div key={status} className="space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ))
        ) : (
            columns.map(status => (
              <div key={status} className="space-y-4 p-4 bg-muted/50 rounded-lg h-full">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {status}
                  <Badge variant="secondary" className="h-6">{bookings.filter(b => b.status === status).length}</Badge>
                </h2>
                <div className="space-y-4">
                  {bookings
                    .filter(b => b.status === status)
                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(booking => (
                      <BookingCard key={booking.id} booking={booking} userRole="admin" />
                  ))}
                   {bookings.filter(b => b.status === status).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No jobs in this stage.</p>
                   )}
                </div>
              </div>
            ))
        )}
      </div>
    </>
  );
}
