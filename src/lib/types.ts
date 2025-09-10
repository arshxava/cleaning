

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

export type Booking = {
  _id: string;
  userId: string;
  userName: string;
  building: string;
  roomType: string;
  service: string;
  date: string;
  time: string;
  timezone: string;
  status: BookingStatus;
  provider: string;
  beforeImages: string[];
  afterImages: string[];
  createdAt: any;
};
