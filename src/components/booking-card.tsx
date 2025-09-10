
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
import { Building, Calendar, Sparkles, User, Image as ImageIcon, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Input } from './ui/input';

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
  beforeImages: string[];
  afterImages: string[];
};

type BookingCardProps = {
    booking: Booking;
    userRole: 'admin' | 'provider';
};

export const BookingCard = ({ booking: initialBooking, userRole }: BookingCardProps) => {
    const [booking, setBooking] = useState(initialBooking);

    // Refs for file inputs
    const beforeImageRef = useRef<HTMLInputElement>(null);
    const afterImageRef = useRef<HTMLInputElement>(null);

    // Mock handlers for state updates
    const handleBeforeImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));
            setBooking(prev => ({
                ...prev,
                beforeImages: [...prev.beforeImages, ...newImageUrls].slice(0, 5),
                status: 'In Process'
            }));
        }
    };
    
    const handleAfterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
         const files = event.target.files;
        if (files) {
            const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));
            setBooking(prev => ({
                ...prev,
                afterImages: [...prev.afterImages, ...newImageUrls].slice(0, 5),
                status: 'Completed'
            }));
        }
    };

    const removeImage = (type: 'before' | 'after', index: number) => {
        setBooking(prev => ({
            ...prev,
            [type === 'before' ? 'beforeImages' : 'afterImages']: prev[type === 'before' ? 'beforeImages' : 'afterImages'].filter((_, i) => i !== index)
        }))
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
        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{booking.user}</span></div>
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{new Date(booking.date).toLocaleDateString()}</span></div>
        
        {userRole === 'provider' && booking.status === 'Aligned' && (
             <Button size="sm" variant="outline" className='w-full' onClick={() => beforeImageRef.current?.click()}>
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
                             {userRole === 'provider' && <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeImage('before', index)}><Trash2 className='h-3 w-3'/></Button>}
                        </div>
                    ))}
                </div>
             </div>
        )}
        
        {userRole === 'provider' && booking.status === 'In Process' && (
             <Button size="sm" className='w-full' onClick={() => afterImageRef.current?.click()}>
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
                            {userRole === 'provider' && <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeImage('after', index)}><Trash2 className='h-3 w-3'/></Button>}
                        </div>
                    ))}
                </div>
             </div>
        )}
      </CardContent>
    </Card>
  );
};
