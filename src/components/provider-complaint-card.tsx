
'use client';

import { useState } from 'react';
import {
  Clock,
  User,
  Building,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from './ui/textarea';
import type { Complaint } from '@/lib/types';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type ProviderComplaintCardProps = {
  complaint: Complaint & { lastResponseHours: number };
  onUpdate?: () => void;
};

export function ProviderComplaintCard({ complaint, onUpdate }: ProviderComplaintCardProps) {
  const { toast } = useToast();
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOverdue = complaint.lastResponseHours > 24;
  const canProviderResolve = complaint.complaintType === 'service_quality';

  const handleSendResponse = async () => {
    if (response.trim().length < 10) {
        toast({
            variant: 'destructive',
            title: 'Response is too short',
            description: 'Please provide a more detailed response.',
        });
        return;
    }
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/complaint-responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                complaintId: complaint._id,
                responseText: response,
                providerName: complaint.provider,
                userId: complaint.userId,
            })
        });

        if (!res.ok) {
            throw new Error('Failed to send response.');
        }

        toast({
            title: 'Response Sent',
            description: 'Your response has been recorded and the complaint is marked as resolved.',
        });
        onUpdate?.(); // Trigger a refresh on the parent component
        setResponse('');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: (error as Error).message
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card className={cn(isOverdue && 'border-destructive')}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-lg">
              Complaint from {complaint.user}
            </CardTitle>
            <CardDescription>
              Received on {new Date(complaint.date).toLocaleString()}
            </CardDescription>
          </div>
          <Badge
            variant={isOverdue ? 'destructive' : 'outline'}
            className="flex items-center gap-2"
          >
            <Clock className="h-3 w-3" />
            {complaint.lastResponseHours} hours ago
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span>{complaint.building}</span>
            </div>
             <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span>Type: <span className="font-medium">{complaint.complaintType === 'damage' ? 'Breakage/Damage' : 'Service Quality'}</span></span>
            </div>
        </div>
        <p className="text-muted-foreground bg-slate-100 p-4 rounded-md border">
          "{complaint.complaint}"
        </p>

        {complaint.imageUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Attached Image:</p>
            <a href={complaint.imageUrl} target="_blank" rel="noopener noreferrer">
              <Image
                src={complaint.imageUrl}
                alt="Complaint image"
                width={200}
                height={200}
                className="rounded-md object-cover border hover:opacity-80 transition-opacity"
                data-ai-hint="complaint photo"
              />
            </a>
          </div>
        )}

        {canProviderResolve ? (
            <div>
                 <Textarea 
                    placeholder={`Write your response to ${complaint.user}...`}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                 />
            </div>
        ) : (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-md">
                <div className="flex items-start">
                    <ShieldAlert className="h-5 w-5 mr-3 mt-1 text-yellow-600" />
                    <div>
                        <h4 className="font-bold">Admin Action Required</h4>
                        <p className="text-sm">This complaint involves potential damages and must be handled by an administrator.</p>
                    </div>
                </div>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {canProviderResolve && (
            <Button onClick={handleSendResponse} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Sending...' : 'Send Response & Resolve'}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
