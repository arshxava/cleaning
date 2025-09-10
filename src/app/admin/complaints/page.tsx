'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ComplaintAnalysisCard } from './complaint-analysis-card';
import type { Complaint } from './complaint-analysis-card';
import { Skeleton } from '@/components/ui/skeleton';


export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/complaints');
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        const data = await response.json();
        const formattedComplaints = data.map((c: any) => ({
          id: c._id,
          user: c.user,
          building: c.building,
          date: c.date,
          text: c.complaint,
          status: c.status,
          provider: c.provider,
          lastResponseHours: c.lastResponseTimestamp
            ? Math.round((new Date().getTime() - new Date(c.lastResponseTimestamp).getTime()) / 3600000)
            : 0,
        }));
        setComplaints(formattedComplaints);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const pendingComplaints = complaints.filter(
    (c) => c.status === 'Pending'
  );

  const resolvedComplaintsData = complaints.filter(c => c.status === 'Resolved');
  const unresolvedComplaints = pendingComplaints.filter(c => c.lastResponseHours > 24);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Complaints Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Review, analyze, and manage student complaints.
        </p>
      </div>

      {unresolvedComplaints.length > 0 && (
        <div className="mb-8 p-4 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground rounded-r-md">
            <div className='flex items-start'>
                <AlertTriangle className="h-5 w-5 mr-3 mt-1 text-destructive" />
                <div>
                    <h3 className="font-bold">Escalation Alert</h3>
                    <p className="text-sm">
                    {unresolvedComplaints.length} complaint(s) have not been responded to in over 24 hours. Please intervene.
                    </p>
                </div>
            </div>
        </div>
      )}


      <div className="grid gap-6">
        {loading ? (
          <>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </>
        ) : pendingComplaints.length > 0 ? (
          pendingComplaints.map((complaint) => (
            <ComplaintAnalysisCard key={complaint.id} complaint={complaint} />
          ))
        ) : (
          <div className='text-center text-muted-foreground bg-card p-8 rounded-lg border'>
            <p>No pending complaints at the moment.</p>
          </div>
        )}
      </div>

       <div className="mt-12">
        <h2 className="text-2xl font-headline font-bold mb-4">Resolved Complaints</h2>
         <div className="grid gap-6">
            {loading ? (
                <Skeleton className="h-24 w-full" />
            ) : resolvedComplaintsData.length > 0 ? (
              resolvedComplaintsData.map((complaint) => (
                <div key={complaint.id} className="p-6 bg-card rounded-lg border opacity-60">
                    <div className="flex justify-between items-start">
                        <div>
                        <h3 className="font-bold">{complaint.user} - {complaint.building}</h3>
                        <p className="text-sm text-muted-foreground">{complaint.id}</p>
                        </div>
                        <Badge variant="secondary">Resolved</Badge>
                    </div>
                </div>
            ))
            ) : (
               <div className='text-center text-muted-foreground bg-card p-8 rounded-lg border'>
                <p>No resolved complaints found.</p>
              </div>
            )}
        </div>
      </div>
    </>
  );
}

