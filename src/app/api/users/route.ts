
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';
import 'dotenv/config';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  initializeApp({
    credential: credential.cert(serviceAccount),
  });
}

const userSchema = z.object({
  // uid is optional as it will be generated for providers on the backend
  uid: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  // For providers created by admin, these might not be present.
  notificationPreference: z.enum(['email', 'sms']).optional(),
  school: z.string().optional(),
  roomSize: z.string().optional(),
  role: z.enum(['user', 'admin', 'provider']).default('user'),
  assignedBuildings: z.array(z.string()).optional(),
  // This field is only for the form, not for the database schema
  password: z.string().min(6).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const userData = userSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    
    let finalUid = userData.uid;

    if (userData.role === 'user') {
      if (!finalUid) {
        return NextResponse.json({ message: 'User UID is required for user role.' }, { status: 400 });
      }
      const existingUser = await usersCollection.findOne({ uid: finalUid });
      if (existingUser) {
        return NextResponse.json({ message: 'User profile already exists.', user: existingUser }, { status: 200 });
      }
    } else if (userData.role === 'provider') {
      try {
        // For providers, check if an auth user exists. If not, create one.
        const userRecord = await getAuth().getUserByEmail(userData.email);
        finalUid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          const newUserRecord = await getAuth().createUser({
            email: userData.email,
            displayName: userData.name,
          });
          finalUid = newUserRecord.uid;
        } else {
           throw error; // Re-throw other Firebase errors
        }
      }
      
      // Check if a profile with this email or UID already exists in our DB
      const existingProfile = await usersCollection.findOne({ $or: [{ email: userData.email }, { uid: finalUid }] });
      if (existingProfile) {
        return NextResponse.json({ message: 'A provider with this email or UID already exists.' }, { status: 409 });
      }
    }

    const { password, ...dataToInsert } = {
        ...userData,
        uid: finalUid,
        createdAt: new Date(),
    };
    
    await usersCollection.insertOne(dataToInsert);

    return NextResponse.json({ message: 'User created successfully', uid: finalUid }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid user data', errors: error.errors }, { status: 400 });
    }
    console.error('Error in POST /api/users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
