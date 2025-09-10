

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  notificationPreference: 'email' | 'sms';
  school: string;
  roomSize: string;
  role: 'user' | 'admin' | 'provider';
  createdAt: any; // Changed to any to accommodate server-side Date and client-side string
  assignedBuildings?: string[]; // Array of building IDs
};

export type BookingStatus = 'Aligned' | 'In Process' | 'Completed';

export type RoomCounts = {
    standard: number;
    deep: number;
    'move-out': number;
}

export type Booking = {
  _id: string;
  userId: string;
  userName: string;
  building: string;
  floor?: string;
  apartmentType?: string;
  apartmentNumber?: string;
  service: string;
  roomCounts: RoomCounts;
  date: string;
  time: string;
  frequency: string;
  price: number;
  status: BookingStatus;
  provider: string;
  beforeImages: string[];
  afterImages: string[];
  createdAt: any;
};

    

    