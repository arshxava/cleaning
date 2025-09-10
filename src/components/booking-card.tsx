
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Calendar, Sparkles, User, Image as ImageIcon, CheckCircle } from 'lucide-react';

export type BookingStatus = 'Aligned' | 'In Process' | 'Completed';

export type Booking = {
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

type BookingCardProps = {
    booking: Booking;
    userRole: 'admin' | 'provider';
};

export const BookingCard = ({ booking, userRole }: BookingCardProps) => {
    
  // A real implementation would have buttons for providers to update status and upload images
  const handleUploadBefore = () => { /* Upload logic */ };
  const handleComplete = () => { /* Completion logic */ };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary"/>
            {booking.service}
          </CardTitle>
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
      {userRole === 'provider' && (
        <CardFooter className="flex justify-end gap-2">
            {booking.status === 'Aligned' && <Button size="sm" variant="outline"><ImageIcon className="mr-2 h-4 w-4" /> Upload Before Image</Button>}
            {booking.status === 'In Process' && <Button size="sm"><CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed</Button>}
        </CardFooter>
      )}
    </Card>
  );
};
