
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Calendar, Sparkles, User, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

type BookingStatus = 'Aligned' | 'In Process' | 'Completed';

type Booking = {
  id: string;
  user: string;
  building: string;
  roomType: string;
  service: string;
  date: string;
  status: BookingStatus;
  provider: string;
  beforeImage?: string;
  afterImage?: string;
};

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

const statusConfig: Record<BookingStatus, { title: string; color: 'blue' | 'yellow' | 'green' }> = {
    Aligned: { title: 'Aligned', color: 'blue' },
    'In Process': { title: 'In Process', color: 'yellow' },
    Completed: { title: 'Completed', color: 'green' },
};

const BookingCard = ({ booking }: { booking: Booking }) => {
    
  // A real implementation would have buttons for providers to update status and upload images
  const handleUploadBefore = () => { /* Upload logic */ };
  const handleComplete = () => { /* Completion logic */ };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline">{booking.service}</CardTitle>
          <Badge variant={booking.status === 'Completed' ? 'default' : 'secondary'}>{booking.status}</Badge>
        </div>
        <CardDescription>{booking.building} - {booking.roomType}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{booking.user}</span></div>
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{new Date(booking.date).toLocaleDateString()}</span></div>
        
        {booking.beforeImage && (
             <div className="space-y-1">
                <p className="font-medium text-xs text-muted-foreground">Before</p>
                <Image src={booking.beforeImage} alt="Before cleaning" width={600} height={400} className="rounded-md" data-ai-hint="messy room" />
             </div>
        )}
        {booking.afterImage && (
             <div className="space-y-1">
                <p className="font-medium text-xs text-muted-foreground">After</p>
                <Image src={booking.afterImage} alt="After cleaning" width={600} height={400} className="rounded-md" data-ai-hint="clean room" />
             </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         {booking.status === 'Aligned' && <Button size="sm" variant="outline"><ImageIcon className="mr-2 h-4 w-4" /> Upload Before Image</Button>}
         {booking.status === 'In Process' && <Button size="sm"><CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed</Button>}
      </CardFooter>
    </Card>
  );
};


export default function OngoingServicesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // For now, we use mock data to demonstrate the UI
    setBookings(mockBookings);
    setLoading(false);
  }, []);

  const columns: BookingStatus[] = ['Aligned', 'In Process', 'Completed'];

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
                      <BookingCard key={booking.id} booking={booking} />
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
