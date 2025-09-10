
'use client';

import {
  Clock,
  User,
  Building,
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

type ProviderComplaintCardProps = Complaint & {
    lastResponseHours: number;
}

export function ProviderComplaintCard({ complaint }: { complaint: ProviderComplaintCardProps }) {
  const isOverdue = complaint.lastResponseHours > 24;

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
        <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span>{complaint.building}</span>
        </div>
        <p className="text-muted-foreground bg-slate-100 p-4 rounded-md border">
          "{complaint.complaint}"
        </p>

        {complaint.imageUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Attached Image:</p>
            <Image
              src={complaint.imageUrl}
              alt="Complaint image"
              width={200}
              height={200}
              className="rounded-md object-cover border"
              data-ai-hint="complaint photo"
            />
          </div>
        )}

        <div>
             <Textarea placeholder={`Write your response to ${complaint.user}...`}/>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button>Send Response</Button>
      </CardFooter>
    </Card>
  );
}
