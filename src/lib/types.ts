

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
