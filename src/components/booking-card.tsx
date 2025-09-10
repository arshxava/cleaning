
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
import { Calendar, Sparkles, User, CheckCircle, Upload, Trash2, Loader2 } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
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
    const [isUploading, startUploading] = useTransition();

    // Refs for file inputs
    const beforeImageRef = useRef<HTMLInputElement>(null);
    const afterImageRef = useRef<HTMLInputElement>(null);

    const getSignature = async () => {
        const response = await fetch('/api/cloudinary/sign');
        const data = await response.json();
        const { signature, timestamp } = data;
        return { signature, timestamp };
    };

    const uploadImageToCloudinary = async (file: File) => {
        const { signature, timestamp } = await getSignature();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp);
        formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);

        const endpoint = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Image upload failed.');
        }

        const data = await response.json();
        return data.secure_url;
    };


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
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        startUploading(async () => {
            try {
                const uploadPromises = Array.from(files).map(uploadImageToCloudinary);
                const newImageUrls = await Promise.all(uploadPromises);

                const existingImages = type === 'before' ? booking.beforeImages : booking.afterImages;
                const updatedImages = [...existingImages, ...newImageUrls].slice(0, 5);
                
                const updateData: Partial<Booking> = {
                    ...(type === 'before' && { beforeImages: updatedImages, status: 'In Process' }),
                    ...(type === 'after' && { afterImages: updatedImages, status: 'Completed' }),
                };
                
                await updateBooking(updateData);
                
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload images to Cloudinary.' });
            }
        });
    };

    const removeImage = (type: 'before' | 'after', imageUrl: string) => {
       const updatedImages = (type === 'before' ? booking.beforeImages : booking.afterImages).filter(url => url !== imageUrl);
       if (type === 'before') {
           updateBooking({ beforeImages: updatedImages });
       } else {
           updateBooking({ afterImages: updatedImages });
       }
    }
    
    const isActionDisabled = isUpdating || isUploading;

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
        <CardDescription>{booking.building} - {booking.apartmentType}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{booking.userName}</span></div>
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{new Date(booking.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span></div>
        
        {userRole === 'provider' && booking.status === 'Aligned' && (
             <Button size="sm" variant="outline" className='w-full' onClick={() => beforeImageRef.current?.click()} disabled={isActionDisabled}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? 'Uploading...' : "Start & Upload 'Before'"}
                <Input ref={beforeImageRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, 'before')} />
            </Button>
        )}

        {booking.beforeImages.length > 0 && (
             <div className="space-y-2">
                <p className="font-medium text-xs text-muted-foreground">Before Images</p>
                <div className="grid grid-cols-3 gap-2">
                    {booking.beforeImages.map((img, index) => (
                        <div key={index} className="relative group">
                            <Image src={img} alt="Before cleaning" width={150} height={100} className="rounded-md object-cover aspect-[3/2]" data-ai-hint="messy room" />
                             {userRole === 'provider' && <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeImage('before', img)} disabled={isActionDisabled}><Trash2 className='h-3 w-3'/></Button>}
                        </div>
                    ))}
                </div>
             </div>
        )}
        
        {userRole === 'provider' && booking.status === 'In Process' && (
             <Button size="sm" className='w-full' onClick={() => afterImageRef.current?.click()} disabled={isActionDisabled}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                {isUploading ? 'Uploading...' : "Complete & Upload 'After'"}
                <Input ref={afterImageRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, 'after')} />
            </Button>
        )}

        {booking.afterImages.length > 0 && (
             <div className="space-y-2">
                <p className="font-medium text-xs text-muted-foreground">After Images</p>
                <div className="grid grid-cols-3 gap-2">
                    {booking.afterImages.map((img, index) => (
                        <div key={index} className="relative group">
                            <Image src={img} alt="After cleaning" width={150} height={100} className="rounded-md object-cover aspect-[3/2]" data-ai-hint="clean room" />
                            {userRole === 'provider' && <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeImage('after', img)} disabled={isActionDisabled}><Trash2 className='h-3 w-3'/></Button>}
                        </div>
                    ))}
                </div>
             </div>
        )}
      </CardContent>
    </Card>
  );
};
