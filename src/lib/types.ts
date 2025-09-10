
export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  notificationPreference: 'email' | 'sms';
  school: string;
  roomSize: string;
  role: 'user' | 'admin' | 'provider';
  createdAt: Date;
};
