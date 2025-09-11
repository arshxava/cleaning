
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';
import 'dotenv/config';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      // The environment variable might come in as a string with escaped newlines.
      // We need to parse it correctly.
      const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n');
      const serviceAccount = JSON.parse(serviceAccountString);
      initializeApp({
        credential: credential.cert(serviceAccount),
      });
    } catch (e) {
      console.error('Failed to parse or initialize Firebase Admin SDK', e);
    }
  } else {
    console.warn('Missing FIREBASE_SERVICE_ACCOUNT environment variable. API routes requiring admin privileges will fail.');
  }
}

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
  assignedBuildings: z.array(z.string()).optional(),
  commissionPercentage: z.number().optional(),
});

export const updateUserSchema = userSchema.partial().omit({ email: true, role: true, password: true });

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html: body }),
    });
    if (!response.ok) {
      console.error("Failed to send welcome email:", await response.text());
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const userData = userSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // For all roles, first check if a profile already exists in our DB
    const existingProfile = await usersCollection.findOne({ email: userData.email });
    if (existingProfile && userData.role !== 'provider') { // Allow provider creation to proceed if profile exists
        return NextResponse.json(
            { message: 'A user with this email already exists in the database.' },
            { status: 409 }
        );
    }

    if (userData.role === 'user') {
      if (!userData.uid) {
        return NextResponse.json({ message: 'User UID is required for user role.' }, { status: 400 });
      }
      
      const { password, ...restOfUserData } = userData;
      const dataToInsert = { ...restOfUserData, createdAt: new Date() };
      const result = await usersCollection.insertOne(dataToInsert);
      
      const createdUser = await usersCollection.findOne({_id: result.insertedId});
      return NextResponse.json(createdUser, { status: 201 });
    }

    if (userData.role === 'provider') {
      if (!userData.password) {
          return NextResponse.json({ message: 'Password is required for provider creation.' }, { status: 400 });
      }
      if (getApps().length === 0) {
        throw new Error('Firebase Admin SDK is not initialized.');
      }

      let uid;
      let isNewFirebaseAuthUser = false;
      try {
        // Check if user exists in Firebase Auth
        const userRecord = await getAuth().getUserByEmail(userData.email);
        uid = userRecord.uid;
        // If user exists, maybe update their name
        if (userRecord.displayName !== userData.name) {
            await getAuth().updateUser(uid, { displayName: userData.name });
        }

      } catch (error: any) {
        // If user does not exist in Firebase Auth, create them
        if (error.code === 'auth/user-not-found') {
          const newUserRecord = await getAuth().createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            emailVerified: true, // Providers are created by admin, so we can assume verified
          });
          uid = newUserRecord.uid;
          isNewFirebaseAuthUser = true;
        } else {
          // Re-throw other Firebase errors
          throw error;
        }
      }
      
      // Now, save or update the provider profile in MongoDB
      const { password, ...restOfUserData } = userData;
      const dataToUpsert = { ...restOfUserData, uid: uid, createdAt: new Date() };

      // We use upsert here: if a profile with the UID exists, update it. If not, insert it.
      // This handles the case where a user signed up but was then made a provider.
      const result = await usersCollection.updateOne(
        { uid: uid },
        { $set: dataToUpsert },
        { upsert: true }
      );
      
      const savedUser = await usersCollection.findOne({ uid: uid });

      // Send welcome email only if we created a new Firebase user with a temp password
      if (isNewFirebaseAuthUser) {
        await sendWelcomeEmail(userData.email, userData.name, userData.password);
      }

      return NextResponse.json(savedUser, { status: 201 });
    }
    
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
