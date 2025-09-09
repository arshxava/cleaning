import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ComplaintAnalysisCard } from './complaint-analysis-card';
import type { Complaint } from './complaint-analysis-card';

const complaints: Complaint[] = [
  {
    id: 'C-101',
    user: 'Alex Johnson',
    building: 'Chestnut Residence',
    date: '2024-07-28T10:00:00Z',
    text: 'The cleaning was incomplete. The bathroom mirror was not wiped and there are still dust bunnies under my desk. I expected a more thorough job for the price.',
    status: 'Pending',
    provider: 'QFS',
    lastResponseHours: 30,
  },
  {
    id: 'C-102',
    user: 'Samantha Lee',
    building: 'Place Vanier',
    date: '2024-07-29T14:30:00Z',
    text: 'The cleaner arrived 45 minutes late without any prior notification. This is unacceptable as I had to reschedule my study group meeting.',
    status: 'Pending',
    provider: 'CleanCo',
    lastResponseHours: 12,
  },
  {
    id: 'C-103',
    user: 'Mike Chen',
    building: 'Royal Victoria College',
    date: '2024-07-27T09:00:00Z',
    text: 'A decorative vase on my shelf was knocked over and broken during the cleaning. I have attached a photo of the item. Please advise on reimbursement.',
    status: 'Resolved',
    provider: 'QFS',
    lastResponseHours: 2,
  },
];

export default function AdminComplaintsPage() {
  const pendingComplaints = complaints.filter(
    (c) => c.status === 'Pending'
  );

  const unresolvedComplaints = pendingComplaints.filter(c => c.lastResponseHours > 24);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
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
        {pendingComplaints.map((complaint) => (
          <ComplaintAnalysisCard key={complaint.id} complaint={complaint} />
        ))}
      </div>

       <div className="mt-12">
        <h2 className="text-2xl font-headline font-bold mb-4">Resolved Complaints</h2>
         <div className="grid gap-6">
            {complaints.filter(c => c.status === 'Resolved').map((complaint) => (
                <div key={complaint.id} className="p-6 bg-card rounded-lg border opacity-60">
                    <div className="flex justify-between items-start">
                        <div>
                        <h3 className="font-bold">{complaint.user} - {complaint.building}</h3>
                        <p className="text-sm text-muted-foreground">{complaint.id}</p>
                        </div>
                        <Badge variant="secondary">Resolved</Badge>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
