
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
// Make sure the path to your service account key is correct.
// NOTE: It's better to use environment variables for service account keys in production.
const serviceAccountPath = path.resolve(process.cwd(), 'campus-clean-jhzd4-firebase-adminsdk-v71t1-9c8f3e582d.json');
const serviceAccount = require(serviceAccountPath);

if (!getApps().length) {
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
    
    // Logic for creating a new provider by an admin
    if (userData.role === 'provider' && !userData.uid) {
      try {
        const userRecord = await getAuth().createUser({
          email: userData.email,
          displayName: userData.name,
          // No password is set here, the provider will set it via a password reset link.
        });
        finalUid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          // If auth user exists, check if a DB record also exists.
          const existingUser = await usersCollection.findOne({ email: userData.email });
          if (existingUser) {
            return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
          }
          // If only auth user exists, get the uid and proceed to create DB record.
          const userRecord = await getAuth().getUserByEmail(userData.email);
          finalUid = userRecord.uid;
        } else {
           throw error; // Re-throw other Firebase Admin errors
        }
      }
    } else if (userData.role === 'user' && !userData.uid) {
      // This case handles regular user sign-up where UID is passed from the client Firebase SDK
      return NextResponse.json({ message: 'User UID is required for user role.' }, { status: 400 });
    }
    
    // Check if user already exists in our DB by email, just in case
    const existingUserInDB = await usersCollection.findOne({ email: userData.email });
    if (existingUserInDB) {
        return NextResponse.json({ message: 'A user with this email already exists in the database.' }, { status: 409 });
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
