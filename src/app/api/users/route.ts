
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

    // For regular user sign-up, the UID is passed from the client. Check if it already exists.
    if (userData.uid) {
        const existingUserByUid = await usersCollection.findOne({ uid: userData.uid });
        if (existingUserByUid) {
            return NextResponse.json({ message: 'User already exists.', user: existingUserByUid }, { status: 200 });
        }
    }
    
    // For any user type, check if the email is already in our database.
    const existingUserByEmail = await usersCollection.findOne({ email: userData.email });
    if (existingUserByEmail) {
        return NextResponse.json({ message: 'A user with this email already exists in the database.' }, { status: 409 });
    }

    let finalUid = userData.uid;
    
    // Logic for creating a new provider by an admin, where UID is not passed from client
    if (userData.role === 'provider' && !userData.uid) {
      try {
        const userRecord = await getAuth().createUser({
          email: userData.email,
          displayName: userData.name,
        });
        finalUid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          const userRecord = await getAuth().getUserByEmail(userData.email);
          finalUid = userRecord.uid;
        } else {
           throw error; 
        }
      }
    } else if (userData.role === 'user' && !userData.uid) {
      return NextResponse.json({ message: 'User UID is required for user role.' }, { status: 400 });
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
