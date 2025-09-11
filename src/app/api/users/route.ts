'use server';

import {NextResponse} from 'next/server';
import clientPromise from '@/lib/mongodb';
import {z} from 'zod';
import {getApps, initializeApp, App} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// Correctly initialize dotenv to load environment variables
import 'dotenv/config';

// --- Robust Firebase Admin SDK Initialization ---
// This function ensures Firebase Admin is initialized only once and safely.
function initializeFirebaseAdmin(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountString) {
    console.error(
      'Firebase Admin SDK Error: FIREBASE_SERVICE_ACCOUNT environment variable is not set or empty.'
    );
    throw new Error(
      'Server configuration error: Missing Firebase service account credentials.'
    );
  }

  try {
    // The service account key is often stored with escaped newlines.
    // This line replaces those with actual newlines before parsing.
    const serviceAccount = JSON.parse(serviceAccountString.replace(/\\n/g, '\n'));
    return initializeApp({
      credential: credential.cert(serviceAccount),
    });
  } catch (e: any) {
    console.error('Failed to parse or initialize Firebase Admin SDK. Raw Error:', e.message);
    throw new Error('Server configuration error: Could not initialize Firebase Admin. Please check the format of FIREBASE_SERVICE_ACCOUNT.');
  }
}

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
  assignedBuildings: z.array(z.string()).optional(),
  commissionPercentage: z.number().optional(),
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

    // Check if a user with this email already exists in the database
    const existingProfile = await usersCollection.findOne({email: userData.email});
    if (existingProfile) {
      return NextResponse.json(
        {message: 'A user with this email already exists in the database.'},
        {status: 409}
      );
    }
    
    // --- Path for Standard User Signup (from client-side) ---
    if (userData.role === 'user') {
      if (!userData.uid) {
        return NextResponse.json({message: 'User UID is required for standard user signup.'}, {status: 400});
      }
      // Don't save password for standard users.
      const {password, ...restOfUserData} = userData;
      const dataToInsert = {...restOfUserData, createdAt: new Date()};
      await usersCollection.insertOne(dataToInsert);
      return NextResponse.json(dataToInsert, {status: 201});
    }

    // --- Path for Provider or Admin Creation (by Admin) ---
    if (userData.role === 'provider' || userData.role === 'admin') {
      if (!userData.password) {
        return NextResponse.json({message: `Password is required for ${userData.role} creation.`}, {status: 400});
      }

      initializeFirebaseAdmin(); // Initialize Admin SDK only when needed

      // Create user in Firebase Authentication
      const userRecord = await getAuth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true, // Users created by an admin can be auto-verified
      });

      // Save the complete profile to our database, linking with the new Firebase UID
      const {password, ...restOfUserData} = userData;
      const dataToInsert = {
        ...restOfUserData,
        uid: userRecord.uid,
        createdAt: new Date(),
      };

      await usersCollection.insertOne(dataToInsert);

      // Send welcome email with credentials if it's a provider
      if (userData.role === 'provider') {
        await sendWelcomeEmail(userData.email, userData.name, userData.password);
      }

      return NextResponse.json(dataToInsert, {status: 201});
    }

    // Fallback for any invalid role not caught by Zod
    return NextResponse.json({message: 'Invalid user role specified.'}, {status: 400});

  } catch (error: any) {
    console.error('[API_USERS_POST_ERROR]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({message: 'Invalid user data provided.', errors: error.errors}, {status: 400});
    }
    
    // Check for Firebase-specific error codes
    if (error.code === 'auth/email-already-exists') {
         return NextResponse.json(
            {message: 'A user with this email already exists in Firebase Authentication. Cannot create a new one.'},
            {status: 409}
        );
    }
    
    // Catch initialization errors or other generic errors
    return NextResponse.json(
      {message: error.message || 'An unexpected internal server error occurred.'},
      {status: 500}
    );
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
