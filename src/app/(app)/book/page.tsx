
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
  Plus,
  Minus,
  Hash,
  DoorOpen,
  Layers,
  DollarSign,
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
import { Input } from '@/components/ui/input';

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

const serviceKeys = {
  'Standard Clean': 'standard',
  'Deep Clean': 'deep',
  'Move-In/Out Clean': 'move-out',
} as const;

type ServiceName = keyof typeof serviceKeys;
type ServiceKey = typeof serviceKeys[ServiceName];

type RoomCounts = {
    standard: number;
    deep: number;
    'move-out': number;
}

type RoomType = {
  name: string;
  count: number;
  prices: {
    standard: number;
    deep: number;
    'move-out': number;
  };
};

type BuildingData = {
  _id: string;
  name: string;
  floors: number;
  roomTypes: RoomType[];
};

export default function BookingPage() {
  const { user, profile } = useSession();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);

  const [building, setBuilding] = useState<string>();
  const [floor, setFloor] = useState<string>();
  const [apartmentType, setApartmentType] = useState<string>();
  const [apartmentNumber, setApartmentNumber] = useState('');
  
  const [roomCounts, setRoomCounts] = useState<RoomCounts>({ standard: 0, deep: 0, 'move-out': 0 });

  const [price, setPrice] = useState(0);

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>();
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
  
  const handleBuildingChange = (buildingId: string) => {
      const buildingData = buildings.find(b => b._id === buildingId);
      setSelectedBuilding(buildingData || null);
      setBuilding(buildingData?.name || '');
      setFloor(undefined);
      setApartmentType(undefined);
  }

  useEffect(() => {
    if (apartmentType && selectedBuilding) {
      const roomTypeData = selectedBuilding.roomTypes.find(rt => rt.name === apartmentType);
      if (roomTypeData) {
        let total = 0;
        for (const key of Object.keys(roomCounts) as (keyof RoomCounts)[]) {
          const count = roomCounts[key];
          if (count > 0) {
            const pricePerRoom = roomTypeData.prices[key] || 0;
            total += pricePerRoom * count;
          }
        }
        setPrice(total);
      }
    } else {
      setPrice(0);
    }
  }, [roomCounts, apartmentType, selectedBuilding]);

  const handleRoomCountChange = (serviceKey: ServiceKey, change: number) => {
    setRoomCounts(prev => ({
      ...prev,
      [serviceKey]: Math.max(0, prev[serviceKey] + change),
    }));
  };
  
  const getSelectedServices = () => {
    return Object.entries(roomCounts)
      .filter(([, count]) => count > 0)
      .map(([key]) => {
        const serviceEntry = Object.entries(serviceKeys).find(([, value]) => value === key);
        return serviceEntry ? serviceEntry[0] as ServiceName : '';
      })
      .filter(Boolean)
      .join(', ');
  }

  const getTotalRooms = () => {
     return Object.values(roomCounts).reduce((sum, count) => sum + count, 0);
  }

  const nextStep = () => setCurrentStep((prev) => (prev < steps.length ? prev + 1 : prev));
  const prevStep = () => setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handleBooking = async () => {
    const totalRooms = getTotalRooms();
    if (!user || !profile || !building || totalRooms === 0 || !date || !time || !frequency) {
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
                floor: floor,
                apartmentType: apartmentType,
                apartmentNumber: apartmentNumber,
                service: getSelectedServices(),
                roomCounts: roomCounts,
                date: format(date, 'yyyy-MM-dd'),
                time: time,
                frequency: frequency,
                price: price,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create booking.');
        }

        toast({
            title: 'Booking Confirmed!',
            description: 'Your cleaning is scheduled. You will receive a confirmation email shortly.',
        });
        
        // Reset state
        setCurrentStep(1);
        setBuilding(undefined);
        setFloor(undefined);
        setApartmentType(undefined);
        setApartmentNumber('');
        setRoomCounts({ standard: 0, deep: 0, 'move-out': 0 });
        setDate(undefined);
        setTime(undefined);
        setFrequency(undefined);
        setSelectedBuilding(null);

    } catch (error) {
        console.error('Booking error:', error);
        toast({ variant: 'destructive', title: 'Booking Failed', description: 'An unexpected error occurred. Please try again.'});
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;
  
  const isStep1Complete = building && floor && apartmentType && apartmentNumber && getTotalRooms() > 0;

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Location Details */}
              <div className="space-y-4">
                 <Label>School/Building</Label>
                 <Select onValueChange={handleBuildingChange} value={selectedBuilding?._id} disabled={!profile}>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select your school or residence" />
                    </SelectTrigger>
                  </div>
                  <SelectContent>
                    {buildings.length > 0 ? buildings.map((b) => (
                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    )) : <SelectItem value="loading" disabled>Loading buildings...</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-4">
                 <Label>Floor Number</Label>
                 <Select onValueChange={setFloor} value={floor} disabled={!selectedBuilding}>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select your floor" />
                    </SelectTrigger>
                  </div>
                  <SelectContent>
                    {selectedBuilding ? Array.from({ length: selectedBuilding.floors }, (_, i) => i + 1).map(f => (
                        <SelectItem key={f} value={f.toString()}>{f}</SelectItem>
                    )) : <SelectItem value="loading" disabled>Select building first</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Apartment Type</Label>
                <Select onValueChange={setApartmentType} value={apartmentType} disabled={!selectedBuilding}>
                  <div className="relative">
                    <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select apartment type" />
                    </SelectTrigger>
                  </div>
                  <SelectContent>
                    {selectedBuilding?.roomTypes.map((rt, i) => (
                        <SelectItem key={i} value={rt.name}>{rt.name}</SelectItem>
                    ))}
                    {!selectedBuilding && <SelectItem value="loading" disabled>Select building first</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Apartment Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="e.g., 401B" value={apartmentNumber} onChange={(e) => setApartmentNumber(e.target.value)} />
                </div>
              </div>

              {/* Service Selection */}
              <div className="md:col-span-2 space-y-4 border-t pt-6 mt-2">
                 <Label className="text-base font-semibold">Select Services and Rooms</Label>
                 <div className="space-y-4">
                    {(Object.keys(serviceKeys) as ServiceName[]).map(serviceName => {
                        const serviceKey = serviceKeys[serviceName];
                        return (
                            <div key={serviceKey} className="flex items-center justify-between p-3 border rounded-md">
                                <p className="font-medium">{serviceName}</p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleRoomCountChange(serviceKey, -1)}><Minus className="h-4 w-4" /></Button>
                                    <Input type="number" className="w-16 text-center" value={roomCounts[serviceKey]} readOnly />
                                    <Button variant="outline" size="icon" onClick={() => handleRoomCountChange(serviceKey, 1)}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        );
                    })}
                 </div>
              </div>

              {(price > 0) && (
                 <div className="md:col-span-2 flex justify-end items-center gap-4 p-4 bg-primary/10 rounded-md border border-primary/20">
                     <p className="font-semibold text-lg text-primary">Estimated Total:</p>
                     <p className="text-2xl font-bold text-primary flex items-center"><DollarSign className="h-5 w-5" />{price.toFixed(2)}</p>
                </div>
              )}

            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 self-start w-full sm:w-auto">
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
            <div className="space-y-6">
              <h3 className="font-semibold">Review Your Booking</h3>
              <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Building:</span>
                    <span className="font-medium text-right">{building || 'Not selected'}</span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Floor:</span>
                    <span className="font-medium text-right">{floor || 'Not selected'}</span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Apt Type:</span>
                    <span className="font-medium text-right">{apartmentType || 'Not selected'}</span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Apt Number:</span>
                    <span className="font-medium text-right">{apartmentNumber || 'Not selected'}</span>
                  </div>
                  <div className="md:col-span-2 space-y-2 border-t pt-4 mt-2">
                     <h4 className="font-medium">Selected Services:</h4>
                      {(Object.keys(serviceKeys) as ServiceName[]).map(serviceName => {
                        const serviceKey = serviceKeys[serviceName];
                        const count = roomCounts[serviceKey];
                        if (count > 0) {
                          return (
                            <div key={serviceKey} className="flex justify-between">
                               <span className="text-muted-foreground">{serviceName}:</span>
                               <span className="font-medium">{count} room(s)</span>
                            </div>
                          )
                        }
                        return null;
                      })}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium text-right">{date ? format(date, 'PPP') : 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium text-right">{time || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium text-right">{frequency || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between md:col-span-2 text-lg font-bold border-t pt-4 mt-2">
                    <span className="text-primary">Total:</span>
                    <span className="text-primary">${price.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <p className="text-center text-muted-foreground text-sm">Mock payment gateway. No real transaction will be made.</p>
            </div>
          )}

        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ChevronLeft /> Previous
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={nextStep} disabled={ (currentStep === 1 && !isStep1Complete) || (currentStep === 2 && (!date || !time)) || (currentStep === 3 && !frequency) }>
              Next <ChevronRight />
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

    