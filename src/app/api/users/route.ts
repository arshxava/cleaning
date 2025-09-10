
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const serviceAccount = require('../../../../campus-clean-jhzd4-firebase-adminsdk-v71t1-9c8f3e582d.json');

if (!getApps().length) {
  initializeApp({
    credential: require('firebase-admin').credential.cert(serviceAccount),
  });
}

const userSchema = z.object({
  // uid is no longer sent from client for providers
  uid: z.string().optional(), 
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  notificationPreference: z.enum(['email', 'sms']),
  school: z.string(),
  roomSize: z.string(),
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

    let finalUid = userData.uid;

    if (userData.role === 'provider' && !userData.uid) {
      // For providers, we create the Firebase Auth user first to get a UID
      try {
        const userRecord = await getAuth().createUser({
          email: userData.email,
          displayName: userData.name,
          // No password set here, user sets it via reset link
        });
        finalUid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          return NextResponse.json({ message: 'An account with this email already exists in Firebase Authentication.' }, { status: 409 });
        }
        throw error; // Re-throw other auth errors
      }
    } else if (userData.role === 'user' && !userData.uid) {
      // This should not happen for regular user sign-up as UID is passed from client
      return NextResponse.json({ message: 'User UID is required for user role.' }, { status: 400 });
    }
    
    // Check if user already exists in MongoDB
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
        return NextResponse.json({ message: 'User with this email already exists in the database.' }, { status: 409 });
    }

    const dataToInsert = {
        ...userData,
        uid: finalUid,
        role: userData.role || 'user',
        createdAt: new Date(),
    };
    
    const result = await usersCollection.insertOne(dataToInsert);

    return NextResponse.json({ message: 'User created successfully', userId: result.insertedId, uid: finalUid }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid user data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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
