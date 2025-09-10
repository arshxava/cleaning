
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/session-provider';
import { BookingCard, Booking } from '@/components/booking-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquareWarning, Wrench } from 'lucide-react';
import { ProviderComplaintCard } from '@/components/provider-complaint-card';
import type { Complaint } from '@/app/admin/complaints/complaint-analysis-card';


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

const mockComplaints: Complaint[] = [
    {
        id: 'comp1',
        user: 'Negative Nancy',
        building: 'Chestnut Residence',
        date: '2024-08-14',
        text: 'The cleaner missed a spot under my bed. This is unacceptable! I want a full refund and a personal apology.',
        status: 'Pending',
        provider: 'Quality First Sparkle',
        lastResponseHours: 12,
    },
    {
        id: 'comp2',
        user: 'Karen Smith',
        building: 'Royal Victoria College',
        date: '2024-08-11',
        text: 'The cleaner was 30 minutes late and tracked mud on my carpet. I have photographic evidence.',
        status: 'Pending',
        provider: 'Quality First Sparkle',
        lastResponseHours: 72,
    }
];


export default function ProviderDashboardPage() {
  const { profile } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // and filter by the current provider's name or ID.
    if (profile) {
        const providerName = profile.name;
        const assignedBookings = mockBookings.filter(b => b.provider === providerName);
        setBookings(assignedBookings);

        const providerComplaints = mockComplaints.filter(c => c.provider === providerName);
        setComplaints(providerComplaints);
    }
    setLoading(false);
  }, [profile]);
  
  const columns: Booking['status'][] = ['Aligned', 'In Process', 'Completed'];

  if (!profile) {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          {profile.name} Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your assigned jobs and respond to client feedback.
        </p>
      </div>

       <Tabs defaultValue="jobs">
        <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
            <TabsTrigger value="jobs">
                <Wrench className="mr-2 h-4 w-4"/>
                Assigned Jobs
            </TabsTrigger>
            <TabsTrigger value="complaints">
                <MessageSquareWarning className="mr-2 h-4 w-4"/>
                Complaints
                {complaints.length > 0 && <Badge className="ml-2">{complaints.length}</Badge>}
            </TabsTrigger>
        </TabsList>
        <TabsContent value="jobs" className="mt-8">
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
        </TabsContent>
        <TabsContent value="complaints" className="mt-8">
            <div className="grid gap-6 max-w-4xl mx-auto">
                {loading ? (
                    <><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></>
                ) : complaints.length > 0 ? (
                    complaints.map((complaint) => (
                        <ProviderComplaintCard key={complaint.id} complaint={complaint} />
                    ))
                ) : (
                    <div className='text-center text-muted-foreground bg-card p-8 rounded-lg border'>
                        <p>You have no pending complaints.</p>
                    </div>
                )}
            </div>
        </TabsContent>
       </Tabs>
    </div>
  );
}
