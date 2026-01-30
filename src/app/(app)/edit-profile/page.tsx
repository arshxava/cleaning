
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Building,
  Mail,
  Home,
  Phone,
  User,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/components/session-provider';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  notificationPreference: z.enum(['email'], {
    required_error: 'Please select a notification preference.',
  }),
  school: z.string({ required_error: 'Please select your school.' }),
  roomSize: z.string({ required_error: 'Please select your room size.' }),
});

type BuildingData = {
  _id: string;
  name: string;
  roomTypes: { name: string }[];
};

export default function EditProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, profile, loading: sessionLoading } = useSession();
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('/api/buildings');
        if (response.ok) {
          const data = await response.json();
          setBuildings(data);
        }
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load building data.' });
      }
    };
    fetchBuildings();
  }, [toast]);
  
  const resetFormWithProfile = useCallback(() => {
    if (profile && buildings.length > 0) {
      form.reset({
        name: profile.name,
        phone: profile.phone,
        notificationPreference: 'email',
        school: profile.school,
        roomSize: profile.roomSize,
      });

      const currentBuilding = buildings.find(b => b.name === profile.school);
      if (currentBuilding) {
        setSelectedBuilding(currentBuilding);
      }
    }
  }, [profile, buildings, form]);

  useEffect(() => {
    resetFormWithProfile();
  }, [profile, buildings, resetFormWithProfile]);

  
  const handleBuildingChange = (buildingName: string) => {
      const buildingData = buildings.find(b => b.name === buildingName);
      setSelectedBuilding(buildingData || null);
      form.setValue('school', buildingName);
      form.resetField('roomSize');
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    try {
      const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile.');
      }
      
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });
      // Optionally, force a session refresh or redirect
      router.push('/dashboard');

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An unexpected error occurred.',
      });
    }
  }
  
  if (sessionLoading || !profile) {
    return <div className="container mx-auto py-12 px-4 md:px-6 max-w-2xl">Loading profile...</div>
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Your Profile</CardTitle>
          <CardDescription>
            Update your account details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="John Doe" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                    <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="email"
                        value={profile.email}
                        readOnly
                        disabled
                        className="pl-10 bg-muted/50"
                    />
                    </div>
                </FormControl>
                 <FormDescription>
                    Email address cannot be changed.
                </FormDescription>
              </FormItem>
            
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="(123) 456-7890"
                          {...field}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notificationPreference"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Notification Preference</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="email" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            Email
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <Select onValueChange={handleBuildingChange} value={field.value}>
                      <FormControl>
                        <div className="relative">
                           <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select your residence" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                         {buildings.length > 0 ? buildings.map((b) => (
                            <SelectItem key={b._id} value={b.name}>{b.name}</SelectItem>
                        )) : <SelectItem value="loading" disabled>Loading buildings...</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Size</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBuilding}>
                      <FormControl>
                        <div className="relative">
                          <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder={!selectedBuilding ? "Select a building first" : "Select your room size"} />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        {selectedBuilding?.roomTypes.map((room, index) => (
                           <SelectItem key={index} value={room.name}>{room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                 <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
