
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
  Lock
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
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

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      notificationPreference: 'email',
    },
  });
  
  const handleBuildingChange = (buildingName: string) => {
      const building = buildings.find(b => b.name === buildingName);
      setSelectedBuilding(building || null);
      form.setValue('school', building?.name || '');
      form.resetField('roomSize');
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Create user profile in your database via API
      // This will also trigger the welcome email from the backend.
      const profileResponse = await fetch('/api/users/ensure-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              uid: user.uid,
              name: values.name,
              email: values.email,
              phone: values.phone,
              notificationPreference: values.notificationPreference,
              school: values.school,
              roomSize: values.roomSize,
              role: 'user', // Default role for new signups
          }),
      });

      if (!profileResponse.ok) {
          // If profile creation fails, we should ideally delete the Firebase user
          // to avoid orphaned accounts. For now, we'll just throw the error.
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || 'Failed to save user profile.');
      }
      
      toast({
          title: 'Account Created Successfully!',
          description: "Welcome! You're now logged in.",
      });

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Sign up error:", error);
      let description = "An unexpected error occurred. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already in use. Please try signing in.";
        form.setError("email", { type: "manual", message: "This email is already taken." });
      } else {
        description = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description,
      });
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Get Started</h1>
            <p className="text-balance text-muted-foreground">
              Create your account to schedule your first cleaning.
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input
                          type="email"
                          placeholder="you@university.edu"
                          {...field}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                        <Input
                          type="tel"
                          placeholder="(123) 456-7890"
                          {...field}
                        />
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
                    <FormLabel>Notify me by</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="email" />
                          </FormControl>
                          <FormLabel className="font-normal">
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
                    <FormLabel>School/Building</FormLabel>
                    <Select onValueChange={handleBuildingChange} defaultValue={field.value}>
                      <FormControl>
                           <SelectTrigger>
                            <SelectValue placeholder="Select your school" />
                          </SelectTrigger>
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
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedBuilding ? "Select building first" : "Select your room size"} />
                          </SelectTrigger>
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
              <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-bold text-primary underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
  );
}
