
'use client';

import { useState, useEffect } from 'react';
import {
  Building,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Home,
  Sparkles,
  Repeat,
  CreditCard,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/components/session-provider';

const steps = [
  { id: 1, name: 'Service', icon: Sparkles },
  { id: 2, name: 'Schedule', icon: CalendarIcon },
  { id: 3, name: 'Frequency', icon: Repeat },
  { id: 4, name: 'Payment', icon: CreditCard },
];

const timeSlots = [
  '11:00 AM - 01:00 PM',
  '01:00 PM - 03:00 PM',
  '03:00 PM - 05:00 PM',
  '05:00 PM - 07:00 PM',
];

const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Halifax', label: 'Atlantic Time (AT)' },
    { value: 'America/St_Johns', label: 'Newfoundland Time (NT)' },
];

type BuildingData = {
  _id: string;
  name: string;
};

export default function BookingPage() {
  const { user, profile } = useSession();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [building, setBuilding] = useState<string>();
  const [service, setService] = useState<string>();
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>();
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [frequency, setFrequency] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }
    };
    fetchBuildings();
  }, []);


  const nextStep = () => setCurrentStep((prev) => (prev < steps.length ? prev + 1 : prev));
  const prevStep = () => setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handleBooking = async () => {
    if (!user || !profile || !building || !service || !date || !time || !timezone || !frequency) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please complete all fields before confirming.' });
        return;
    }
    
    setIsSubmitting(true);

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.uid,
                userName: profile.name,
                building: building,
                service: service,
                date: format(date, 'yyyy-MM-dd'),
                time: time,
                timezone: timezone,
                frequency: frequency,
                roomType: profile.roomSize, // Assuming room size is part of the user profile
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create booking.');
        }

        toast({
            title: 'Booking Confirmed!',
            description: 'Your cleaning is scheduled. You will receive a confirmation email shortly.',
        });
        
        // Reset state and move to first step
        setCurrentStep(1);
        setBuilding(undefined);
        setService(undefined);
        setDate(undefined);
        setTime(undefined);
        setTimezone('America/New_York');
        setFrequency(undefined);

    } catch (error) {
        console.error('Booking error:', error);
        toast({ variant: 'destructive', title: 'Booking Failed', description: 'An unexpected error occurred. Please try again.'});
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-center">
          Schedule Your Cleaning
        </h1>
        <p className="text-muted-foreground text-center mt-2">
          Follow these simple steps to a sparkling clean room.
        </p>
      </div>

      <div className="mb-8 px-4">
        <Progress value={progressValue} className="w-full" />
        <ol className="mt-4 grid grid-cols-4 text-sm font-medium text-muted-foreground">
          {steps.map((step, index) => (
            <li key={step.name} className={cn("flex items-center gap-2", { "text-primary font-semibold": currentStep > index, "justify-center": index > 0 && index < steps.length - 1, "justify-end": index === steps.length - 1 })}>
               <Check className={cn("h-5 w-5 rounded-full", currentStep > index + 1 ? 'bg-primary text-primary-foreground' : 'text-primary' )} />
               <span className="hidden md:inline">{step.name}</span>
            </li>
          ))}
        </ol>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            Step {currentStep}: {steps[currentStep - 1].name}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Tell us where and what to clean.'}
            {currentStep === 2 && 'Choose a convenient date and time.'}
            {currentStep === 3 && 'Set a recurring schedule. Minimum 3 cleanings required.'}
            {currentStep === 4 && 'Review your booking and complete payment.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-[300px]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label>School/Building</Label>
                 <Select onValueChange={setBuilding} value={building} disabled={!profile}>
                  <div className="relative mt-2">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select your school or residence" />
                    </SelectTrigger>
                  </div>
                  <SelectContent>
                    {buildings.length > 0 ? buildings.map((b) => (
                        <SelectItem key={b._id} value={b.name}>{b.name}</SelectItem>
                    )) : <SelectItem value="loading" disabled>Loading buildings...</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Type</Label>
                <Select onValueChange={setService} value={service}>
                  <div className="relative mt-2">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select a cleaning service" />
                    </SelectTrigger>
                  </div>
                  <SelectContent>
                    <SelectItem value="Standard Clean">Standard Clean</SelectItem>
                    <SelectItem value="Deep Clean">Deep Clean</SelectItem>
                    <SelectItem value="Move-In/Out Clean">Move-In/Out Clean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border p-0"
                    disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
                  />
                  <div>
                    <Label>Timezone</Label>
                     <Select onValueChange={setTimezone} value={timezone}>
                        <div className="relative mt-2">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Select your timezone" />
                            </SelectTrigger>
                        </div>
                        <SelectContent>
                            {timezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                  </div>
                </div>
              <div className="grid grid-cols-1 gap-2 self-start">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={time === slot ? 'default' : 'outline'}
                    onClick={() => setTime(slot)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
             <RadioGroup onValueChange={setFrequency} value={frequency} className="space-y-4">
                <Label htmlFor="bi-weekly" className="flex items-center p-4 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                    <RadioGroupItem value="bi-weekly" id="bi-weekly" className="mr-4" />
                    <div className="flex-grow">
                        <p className="font-semibold">Bi-Weekly</p>
                        <p className="text-sm text-muted-foreground">Every two weeks. Perfect for staying on top of things.</p>
                    </div>
                </Label>
                 <Label htmlFor="monthly" className="flex items-center p-4 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                    <RadioGroupItem value="monthly" id="monthly" className="mr-4"/>
                    <div className="flex-grow">
                        <p className="font-semibold">Monthly</p>
                        <p className="text-sm text-muted-foreground">A thorough clean once a month.</p>
                    </div>
                </Label>
             </RadioGroup>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review Your Booking</h3>
              <Card>
                <CardContent className="p-6 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Building:</span>
                    <span className="font-medium">{building || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{service || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{date ? format(date, 'PPP') : 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{time || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone:</span>
                    <span className="font-medium">{timezones.find(tz => tz.value === timezone)?.label || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">{frequency || 'Not selected'}</span>
                  </div>
                </CardContent>
              </Card>
              <p className="text-center text-muted-foreground text-sm">Mock payment gateway. No real transaction will be made.</p>
            </div>
          )}

        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ChevronLeft className="mr-2" /> Previous
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={nextStep} disabled={ (currentStep === 1 && (!building || !service)) || (currentStep === 2 && (!date || !time || !timezone)) || (currentStep === 3 && !frequency) }>
              Next <ChevronRight className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleBooking} disabled={isSubmitting}>
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'} <Check className="ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
