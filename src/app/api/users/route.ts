
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
      // For a regular user sign-up, the auth user is already created on the client.
      // We just need to check if a DB profile already exists for this UID.
      const existingUser = await usersCollection.findOne({ uid: finalUid });
      if (existingUser) {
        // This prevents a crash if the API is called twice for the same user.
        return NextResponse.json({ message: 'User profile already exists.', user: existingUser }, { status: 200 });
      }
    } else if (userData.role === 'provider') {
      // For providers created by an admin, the auth user might not exist yet.
      const existingProfile = await usersCollection.findOne({ email: userData.email });
      if (existingProfile) {
        return NextResponse.json({ message: 'A provider with this email already exists.' }, { status: 409 });
      }
      
      try {
        // Check if an auth user exists.
        const userRecord = await getAuth().getUserByEmail(userData.email);
        finalUid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // If not, create one.
          const newUserRecord = await getAuth().createUser({
            email: userData.email,
            displayName: userData.name,
          });
          finalUid = newUserRecord.uid;
        } else {
           throw error; // Re-throw other Firebase errors
        }
      }
    }

    // Remove the password field before inserting into the database
    const { password, ...dataToInsert } = {
        ...userData,
        uid: finalUid, // Ensure the final UID is set
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
