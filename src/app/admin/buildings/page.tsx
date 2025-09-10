
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Building, Home, Hash, MapPin, DollarSign, Sparkles, Trash, PlusCircle, Calendar, User, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const availableServices = [
  { id: 'standard', label: 'Standard Clean' },
  { id: 'deep', label: 'Deep Clean' },
  { id: 'move-out', label: 'Move-In/Out Clean' },
] as const;

const roomTypeSchema = z.object({
    name: z.string().min(1, "Room type name is required."),
    count: z.coerce.number().min(1, "At least one room is required."),
    prices: z.object({
        standard: z.coerce.number().min(0),
        deep: z.coerce.number().min(0),
        'move-out': z.coerce.number().min(0),
    }).refine(prices => prices.standard > 0 || prices.deep > 0 || prices['move-out'] > 0, {
        message: "At least one service price must be greater than 0."
    })
});

const formSchema = z.object({
  name: z.string().min(3, 'Building name must be at least 3 characters.'),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
  roomTypes: z.array(roomTypeSchema).min(1, "You must add at least one room type.")
});

type Building = {
  _id: string;
  name: string;
  location: string;
  roomTypes: z.infer<typeof roomTypeSchema>[];
  createdAt: string;
}

// Mock data - replace with API call later
const ongoingBookings = [
    { id: 1, buildingName: 'Chestnut Residence', userName: 'Alice Johnson', service: 'Deep Clean', date: '2024-08-15', roomType: 'Single Dorm' },
    { id: 2, buildingName: 'Place Vanier', userName: 'Bob Williams', service: 'Standard Clean', date: '2024-08-16', roomType: 'Double Dorm' },
];

export default function BuildingsPage() {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      roomTypes: [{ name: 'Single Dorm', count: 10, prices: { standard: 50, deep: 80, 'move-out': 120 } }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roomTypes"
  });

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/buildings');
      if (!response.ok) {
        throw new Error('Failed to fetch buildings');
      }
      const data = await response.json();
      setBuildings(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch buildings.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to add building.');
      }

      toast({
        title: 'Building Added',
        description: `Successfully added ${values.name}.`,
      });
      form.reset();
      fetchBuildings(); // Refresh list
    } catch (error) {
      console.error('Building submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Manage Buildings
        </h1>
        <p className="text-muted-foreground mt-2">
          Add new buildings and define room types with service-specific pricing.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add a New Building</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Name</FormLabel>
                        <FormControl><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="e.g., Chestnut Residence" {...field} className="pl-10" /></div></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="e.g., Toronto, ON" {...field} className="pl-10" /></div></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div>
                     <h3 className="text-lg font-medium mb-4">Room Types & Pricing</h3>
                     <div className="space-y-6">
                       {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                           <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
                           <FormField control={form.control} name={`roomTypes.${index}.name`} render={({ field }) => (
                               <FormItem><FormLabel>Room Type Name</FormLabel><FormControl><Input placeholder="e.g., Single Dorm" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`roomTypes.${index}.count`} render={({ field }) => (
                                <FormItem><FormLabel>Number of Rooms</FormLabel><FormControl><Input type="number" placeholder="e.g., 50" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className='space-y-2'>
                                <FormLabel>Service Prices (CAD)</FormLabel>
                                {availableServices.map(service => (
                                    <FormField key={service.id} control={form.control} name={`roomTypes.${index}.prices.${service.id}`} render={({ field }) => (
                                       <FormItem><FormControl><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" placeholder={service.label} {...field} className="pl-10" /></div></FormControl><FormMessage /></FormItem>
                                    )}/>
                                ))}
                            </div>
                        </div>
                       ))}
                     </div>
                     <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ name: '', count: 1, prices: { standard: 0, deep: 0, 'move-out': 0 }})}><PlusCircle className="mr-2 h-4 w-4" /> Add Room Type</Button>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adding...' : 'Add Building'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <Card>
             <CardHeader>
              <CardTitle>Existing Buildings</CardTitle>
              <CardDescription>
                A list of all buildings and their room configurations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></>
                ) : buildings.length > 0 ? (
                  buildings.map((building) => (
                    <Card key={building._id}>
                      <CardHeader>
                        <CardTitle>{building.name}</CardTitle>
                        <CardDescription>{building.location}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {building.roomTypes.map((room, index) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-md">
                            <div className='flex justify-between items-center mb-2'>
                                <p className="font-semibold">{room.name}</p>
                                <Badge variant="secondary">{room.count} rooms</Badge>
                            </div>
                            <div className='grid grid-cols-3 gap-x-4 text-sm'>
                                {Object.entries(room.prices).map(([serviceId, price]) => {
                                    const service = availableServices.find(s => s.id === serviceId);
                                    return price > 0 ? <p key={serviceId}>{service?.label}: <span className='font-medium'>${price.toFixed(2)}</span></p> : null;
                                })}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className='text-center text-muted-foreground bg-slate-50 py-8 rounded-md'>
                    <p>No buildings have been added yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Ongoing Services</CardTitle>
                <CardDescription>A view of current and upcoming bookings across all buildings.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {loading ? (
                  <>
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </>
                ) : ongoingBookings.length > 0 ? (
                    ongoingBookings.map(booking => (
                        <Card key={booking.id} className="flex flex-col justify-between">
                            <CardHeader>
                                <CardTitle className="text-xl">{booking.buildingName}</CardTitle>
                                <CardDescription>{booking.roomType}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span>{booking.service}</span></div>
                                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{booking.userName}</span></div>
                                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{booking.date}</span></div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className='text-center text-muted-foreground bg-slate-50 py-8 rounded-md md:col-span-2'>
                        <p>No ongoing bookings right now.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
