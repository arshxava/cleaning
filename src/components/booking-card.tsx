
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
import { Calendar, Sparkles, User, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/lib/types';


type BookingCardProps = {
    booking: Booking;
    userRole: 'admin' | 'provider';
    onUpdate?: () => void;
};

export const BookingCard = ({ booking, userRole, onUpdate }: BookingCardProps) => {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    // Refs for file inputs
    const beforeImageRef = useRef<HTMLInputElement>(null);
    const afterImageRef = useRef<HTMLInputElement>(null);

    const updateBooking = async (updateData: Partial<Booking>) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/bookings?id=${booking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error('Failed to update booking');
            }

            toast({ title: "Success", description: "Booking status updated."});
            onUpdate?.(); // Callback to refresh the list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsUpdating(false);
        }
    }

    // Mock image upload handlers - in a real app this would upload to a cloud storage service
    const handleBeforeImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            // Using picsum as placeholder for uploaded images
            const newImageUrls = Array.from(files).map((_, i) => `https://picsum.photos/seed/${booking._id}-before-${booking.beforeImages.length + i}/${600}/${400}`);
            updateBooking({
                beforeImages: [...booking.beforeImages, ...newImageUrls].slice(0, 5),
                status: 'In Process'
            });
        }
    };
    
    const handleAfterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
         const files = event.target.files;
         if (files && files.length > 0) {
            const newImageUrls = Array.from(files).map((_, i) => `https://picsum.photos/seed/${booking._id}-after-${booking.afterImages.length + i}/${600}/${400}`);
            updateBooking({
                afterImages: [...booking.afterImages, ...newImageUrls].slice(0, 5),
                status: 'Completed'
            });
        }
    };

    const removeImage = (type: 'before' | 'after', imageUrl: string) => {
       const updatedImages = (type === 'before' ? booking.beforeImages : booking.afterImages).filter(url => url !== imageUrl);
       if (type === 'before') {
           updateBooking({ beforeImages: updatedImages });
       } else {
           updateBooking({ afterImages: updatedImages });
       }
    }

  return (
    <Card className="w-full flex flex-col">
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
      <CardContent className="space-y-3 text-sm flex-grow">
        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{booking.userName}</span></div>
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{new Date(booking.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span></div>
        
        {userRole === 'provider' && booking.status === 'Aligned' && (
             <Button size="sm" variant="outline" className='w-full' onClick={() => beforeImageRef.current?.click()} disabled={isUpdating}>
                <Upload className="mr-2 h-4 w-4" /> Start Job & Upload 'Before'
                <Input ref={beforeImageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBeforeImageUpload} />
            </Button>
        )}

        {booking.beforeImages.length > 0 && (
             <div className="space-y-2">
                <p className="font-medium text-xs text-muted-foreground">Before Images</p>
                <div className="grid grid-cols-3 gap-2">
                    {booking.beforeImages.map((img, index) => (
                        <div key={index} className="relative group">
                            <Image src={img} alt="Before cleaning" width={150} height={100} className="rounded-md object-cover aspect-[3/2]" data-ai-hint="messy room" />
                             {userRole === 'provider' && <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeImage('before', img)} disabled={isUpdating}><Trash2 className='h-3 w-3'/></Button>}
                        </div>
                    ))}
                </div>
             </div>
        )}
        
        {userRole === 'provider' && booking.status === 'In Process' && (
             <Button size="sm" className='w-full' onClick={() => afterImageRef.current?.click()} disabled={isUpdating}>
                <CheckCircle className="mr-2 h-4 w-4" /> Complete & Upload 'After'
                <Input ref={afterImageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAfterImageUpload} />
            </Button>
        )}

        {booking.afterImages.length > 0 && (
             <div className="space-y-2">
                <p className="font-medium text-xs text-muted-foreground">After Images</p>
                <div className="grid grid-cols-3 gap-2">
                    {booking.afterImages.map((img, index) => (
                        <div key={index} className="relative group">
                            <Image src={img} alt="After cleaning" width={150} height={100} className="rounded-md object-cover aspect-[3/2]" data-ai-hint="clean room" />
                            {userRole === 'provider' && <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeImage('after', img)} disabled={isUpdating}><Trash2 className='h-3 w-3'/></Button>}
                        </div>
                    ))}
                </div>
             </div>
        )}
      </CardContent>
    </Card>
  );
};
