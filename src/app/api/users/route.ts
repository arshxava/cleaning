
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
  uid: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  notificationPreference: z.enum(['email', 'sms']).optional(),
  school: z.string().optional(),
  roomSize: z.string().optional(),
  role: z.enum(['user', 'admin', 'provider']).default('user'),
  assignedBuildings: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const userData = userSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // --- Path for Regular User Sign-up ---
    if (userData.role === 'user') {
      if (!userData.uid) {
        return NextResponse.json({ message: 'User UID is required for user role.' }, { status: 400 });
      }
      
      const existingUser = await usersCollection.findOne({ uid: userData.uid });
      if (existingUser) {
        return NextResponse.json({ message: 'User profile already exists.', uid: userData.uid }, { status: 200 });
      }

      const dataToInsert = { ...userData, createdAt: new Date() };
      const result = await usersCollection.insertOne(dataToInsert);
      
      return NextResponse.json({ message: 'User profile created successfully.', uid: result.insertedId }, { status: 201 });
    }

    // --- Path for Admin Creating a Provider ---
    if (userData.role === 'provider') {
       const existingProfile = await usersCollection.findOne({ email: userData.email });
      if (existingProfile) {
        return NextResponse.json(
          { message: 'A user with this email already exists in the database.' },
          { status: 409 }
        );
      }

      let uid;
      try {
        // Check if user exists in Firebase Auth
        const userRecord = await getAuth().getUserByEmail(userData.email);
        uid = userRecord.uid;
      } catch (error: any) {
        // If user not found, create one in Firebase Auth
        if (error.code === 'auth/user-not-found') {
          const newUserRecord = await getAuth().createUser({
            email: userData.email,
            displayName: userData.name,
            emailVerified: true, 
          });
          uid = newUserRecord.uid;
        } else {
          // Re-throw other auth errors
          throw error;
        }
      }
      
      const dataToInsert = { ...userData, uid: uid, createdAt: new Date() };
      await usersCollection.insertOne(dataToInsert);

      return NextResponse.json({ message: 'Provider created successfully', uid: uid }, { status: 201 });
    }
    
    // Fallback for any other roles or invalid requests
    return NextResponse.json({ message: 'Invalid user role specified.' }, { status: 400 });

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
