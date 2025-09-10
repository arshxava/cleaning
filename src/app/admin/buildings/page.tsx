
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Building, Home, Hash, MapPin, DollarSign } from 'lucide-react';

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

const formSchema = z.object({
  name: z.string().min(3, 'Building name must be at least 3 characters.'),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
  floors: z.coerce.number().min(1, 'A building must have at least 1 floor.'),
  perRoomPrice: z.coerce.number().min(1, 'Price must be greater than 0.'),
});

type Building = {
  _id: string;
  name: string;
  location: string;
  floors: number;
  perRoomPrice: number;
  createdAt: string;
}

export default function BuildingsPage() {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      floors: 1,
      perRoomPrice: 50,
    },
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
          Add, edit, or remove school residences and apartments.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add a New Building</CardTitle>
              <CardDescription>
                Enter the details for a new building.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Name</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="e.g., Chestnut Residence" {...field} className="pl-10" />
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="e.g., Toronto, ON" {...field} className="pl-10" />
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Floors</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perRoomPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Room (CAD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adding...' : 'Add Building'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
             <CardHeader>
              <CardTitle>Existing Buildings</CardTitle>
              <CardDescription>
                Here is a list of all buildings currently in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : buildings.length > 0 ? (
                  buildings.map((building) => (
                    <div key={building._id} className="flex items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{building.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3" /> {building.location}
                        </p>
                      </div>
                       <div className="text-right">
                          <p className="font-semibold text-lg">${building.perRoomPrice.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{building.floors} floors</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  ))
                ) : (
                  <div className='text-center text-muted-foreground bg-slate-50 py-8 rounded-md'>
                    <p>No buildings have been added yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
