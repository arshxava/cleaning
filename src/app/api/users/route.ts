
'use server';

import {NextResponse} from 'next/server';
import clientPromise from '@/lib/mongodb';
import {z} from 'zod';

// --- Zod Schemas for Validation ---
const userSchema = z.object({
  uid: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
  phone: z.string(),
  notificationPreference: z.enum(['email', 'sms']).optional(),
  school: z.string().optional(),
  roomSize: z.string().optional(),
  role: z.enum(['user', 'admin', 'provider']).default('user'),
  commissionPercentage: z.coerce.number().optional(),
});

export const updateUserSchema = userSchema.partial().omit({email: true, role: true, password: true});

// --- Email Sending Function ---
async function sendWelcomeEmail(to: string, name: string, password?: string) {
  const subject = 'Welcome to A+ Cleaning Solutions!';
  const body = `
    <h1>Hi ${name},</h1>
    <p>An account has been created for you on the A+ Cleaning Solutions platform.</p>
    <p>Your username is your email address: ${to}</p>
    ${password ? `<p>Your temporary password is: <strong>${password}</strong></p><p>Please log in and change it as soon as possible.</p>` : ''}
    <p>You can log in here: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/sign-in">Login Page</a></p>
    <p>Thanks,</p>
    <p>The A+ Cleaning Solutions Team</p>
  `;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({to, subject, html: body}),
    });
    if (!response.ok) {
      console.error('Failed to send welcome email:', await response.text());
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

// --- Main API Route Handlers ---
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const userData = userSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
        return NextResponse.json({ message: 'User already exists.' }, { status: 409 });
    }

    if (userData.role === 'user') {
      if (!userData.uid) {
        return NextResponse.json({message: 'User UID is required for standard signup.'}, {status: 400});
      }
      const {password, ...restOfUserData} = userData;
      const dataToInsert = {...restOfUserData, createdAt: new Date()};
      await usersCollection.insertOne(dataToInsert);
      return NextResponse.json(dataToInsert, {status: 201});
    }

    if (userData.role === 'provider' || userData.role === 'admin') {
      if (!userData.password) {
        return NextResponse.json({message: `Password is required for ${userData.role} creation.`}, {status: 400});
      }
      
      // Dynamically import and initialize Firebase Admin SDK
      const { getApps, initializeApp, cert } = require('firebase-admin/app');
      const { getAuth } = require('firebase-admin/auth');

      const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!serviceAccountString) {
          throw new Error('Server configuration error: Missing Firebase service account credentials.');
      }
      
      const serviceAccount = JSON.parse(serviceAccountString);

      const adminApp = getApps().length > 0 
          ? getApps()[0] 
          : initializeApp({ credential: cert(serviceAccount) });

      const auth = getAuth(adminApp);
      
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true,
      });
      
      const {password, ...restOfUserData} = userData;
      const dataToInsert = {
        ...restOfUserData,
        uid: userRecord.uid,
        createdAt: new Date(),
      };
      await usersCollection.insertOne(dataToInsert);

      if (userData.role === 'provider') {
        await sendWelcomeEmail(userData.email, userData.name, userData.password);
      }
      
      return NextResponse.json(dataToInsert, {status: 201});
    }

    return NextResponse.json({message: 'Invalid user role specified.'}, {status: 400});

  } catch (error: any) {
    console.error('[API_USERS_POST_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({message: 'Invalid data provided.', errors: error.errors}, {status: 400});
    }
     // Check for Firebase-specific errors
    if (error.code && error.code.startsWith('auth/')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({message: error.message || 'An unexpected internal server error occurred.'}, {status: 500});
  }
}


export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const users = await db.collection('users').find({}).sort({createdAt: -1}).toArray();
    return NextResponse.json(users, {status: 200});
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}
