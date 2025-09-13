





export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  notificationPreference?: 'email' | 'sms';
  school?: string;
  roomSize?: string;
  role: 'user' | 'admin' | 'provider';
  createdAt: any; // Changed to any to accommodate server-side Date and client-side string
  assignedBuildings?: string[]; // Array of building IDs
  commissionPercentage?: number;
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
  providerPaid?: boolean;
};

export type Complaint = {
  _id: string;
  userId: string;
  user: string;
  building: string;
  complaint: string; // The text of the complaint
  imageUrl?: string;
  bookingId?: string;
  date: any;
  status: 'Pending' | 'Resolved';
  provider: string;
  lastResponseTimestamp?: any;
};
    
export type InvoiceRequest = {
  _id: string;
  providerId: string;
  providerName: string;
  requestDate: any;
  status: 'pending' | 'paid';
  month: number;
  year: number;
}
    

