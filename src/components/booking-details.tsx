
'use client';

import Image from 'next/image';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Booking, RoomCounts } from '@/lib/types';
import {
  Calendar,
  Sparkles,
  User,
  Building,
  Layers,
  DoorOpen,
  Hash,
  Clock,
  Repeat,
  DollarSign,
  Camera,
} from 'lucide-react';


const serviceKeys = {
  'Standard Clean': 'standard',
  'Deep Clean': 'deep',
  'Move-In/Out Clean': 'move-out',
} as const;

type ServiceName = keyof typeof serviceKeys;


export function BookingDetails({ booking }: { booking: Booking }) {

  const getServicesFromRoomCounts = (roomCounts: RoomCounts) => {
    return (Object.keys(serviceKeys) as ServiceName[]).map(serviceName => {
        const serviceKey = serviceKeys[serviceName];
        const count = roomCounts[serviceKey];
        if (count > 0) {
          return { name: serviceName, count: count }
        }
        return null;
      }).filter(Boolean);
  }

  const selectedServices = getServicesFromRoomCounts(booking.roomCounts);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          Booking Details
          <Badge variant={booking.status === 'Completed' ? 'outline' : 'default'}>
            {booking.status}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Full details for booking ID: {booking._id}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Client:</span> {booking.userName}</span></div>
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Provider:</span> {booking.provider}</span></div>
            <div className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Building:</span> {booking.building}</span></div>
            <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Floor:</span> {booking.floor}</span></div>
            <div className="flex items-center gap-2"><DoorOpen className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Apt Type:</span> {booking.apartmentType}</span></div>
            <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Apt Number:</span> {booking.apartmentNumber}</span></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Date:</span> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'})}</span></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Time:</span> {booking.time}</span></div>
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span><span className='font-medium'>Price:</span> ${booking.price.toFixed(2)}</span></div>
        </div>

        <Separator />

        <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Services</h4>
            <div className='space-y-1 text-sm'>
             {selectedServices.map(service => service && (
                <div key={service.name} className="flex justify-between">
                    <span>{service.name}</span>
                    <span className="text-muted-foreground">{service.count} room(s)</span>
                </div>
            ))}
            </div>
        </div>

        {(booking.beforeImages?.length > 0 || booking.afterImages?.length > 0) && <Separator />}

        {booking.beforeImages?.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Camera className="h-4 w-4" /> Before Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {booking.beforeImages.map((img, index) => (
                <a key={index} href={img} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={img}
                    alt="Before cleaning"
                    width={200}
                    height={150}
                    className="rounded-md object-cover aspect-[4/3] hover:opacity-80 transition-opacity"
                    data-ai-hint="messy room"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {booking.afterImages?.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Camera className="h-4 w-4" /> After Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {booking.afterImages.map((img, index) => (
                 <a key={index} href={img} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={img}
                      alt="After cleaning"
                      width={200}
                      height={150}
                      className="rounded-md object-cover aspect-[4/3] hover:opacity-80 transition-opacity"
                      data-ai-hint="clean room"
                    />
                 </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

    