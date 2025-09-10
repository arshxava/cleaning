
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/session-provider';
import { BookingCard } from '@/components/booking-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquareWarning, Wrench } from 'lucide-react';
import { ProviderComplaintCard } from '@/components/provider-complaint-card';
import type { Complaint } from '@/app/admin/complaints/complaint-analysis-card';
import { Booking } from '@/lib/types';


export default function ProviderDashboardPage() {
  const { profile } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviderData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
        const [bookingsRes, complaintsRes] = await Promise.all([
            fetch('/api/bookings'),
            fetch('/api/complaints'),
        ]);

        if (bookingsRes.ok) {
            const allBookings = await bookingsRes.json();
            setBookings(allBookings.filter((b: Booking) => b.provider === profile.name));
        }

        if (complaintsRes.ok) {
            const allComplaints = await complaintsRes.json();
            setComplaints(allComplaints.filter((c: Complaint) => c.provider === profile.name));
        }

    } catch (error) {
        console.error("Failed to fetch provider data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
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

  const handleBookingUpdate = () => {
    // Refetch data after an update
    fetchProviderData();
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
                {complaints.filter(c => c.status === 'Pending').length > 0 && <Badge className="ml-2">{complaints.filter(c => c.status === 'Pending').length}</Badge>}
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
                        <BookingCard key={booking._id} booking={booking} userRole="provider" onUpdate={handleBookingUpdate} />
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
                    complaints
                     .filter(c => c.status === 'Pending')
                     .map((complaint) => (
                        <ProviderComplaintCard key={complaint.id} complaint={complaint} />
                    ))
                ) : (
                    <div className='text-center text-muted-foreground bg-card p-8 rounded-lg border'>
                        <p>You have no pending complaints.</p>
                    </div>
                )}
                 {complaints.filter(c => c.status === 'Pending').length === 0 && !loading && (
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
