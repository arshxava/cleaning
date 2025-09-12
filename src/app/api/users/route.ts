'use server';

import {NextResponse} from 'next/server';
import clientPromise from '@/lib/mongodb';
import {z} from 'zod';
import { credential } from 'firebase-admin';

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
  console.log('[API_USERS_POST] Received new user creation request.');
  try {
    const json = await request.json();
    console.log('[API_USERS_POST] Request body parsed.');
    
    const userData = userSchema.parse(json);
    console.log('[API_USERS_POST] Zod schema parsed successfully. Role:', userData.role);


    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
        console.log('[API_USERS_POST] Error: User already exists.');
        return NextResponse.json({ message: 'User already exists.' }, { status: 409 });
    }
    
    console.log('[API_USERS_POST] Checked for existing user.');


    if (userData.role === 'user') {
      console.log('[API_USERS_POST] Handling standard "user" creation.');
      if (!userData.uid) {
        return NextResponse.json({message: 'User UID is required for standard signup.'}, {status: 400});
      }
      const {password, ...restOfUserData} = userData;
      const dataToInsert = {...restOfUserData, createdAt: new Date()};
      await usersCollection.insertOne(dataToInsert);
      console.log('[API_USERS_POST] "user" inserted into database.');
      return NextResponse.json(dataToInsert, {status: 201});
    }

    if (userData.role === 'provider' || userData.role === 'admin') {
      console.log(`[API_USERS_POST] Handling "${userData.role}" creation.`);
      if (!userData.password) {
        return NextResponse.json({message: `Password is required for ${userData.role} creation.`}, {status: 400});
      }
      
      const { getApps, initializeApp, cert } = await import('firebase-admin/app');
      const { getAuth } = await import('firebase-admin/auth');
      
      console.log('[API_USERS_POST] Dynamically imported firebase-admin modules.');

      let adminApp;
      if (!getApps().length) {
          console.log('[API_USERS_POST] No Firebase admin app initialized. Initializing now.');
          const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
          if (!serviceAccountString) {
              console.error('[API_USERS_POST] CRITICAL: FIREBASE_SERVICE_ACCOUNT env var is missing.');
              throw new Error('Server configuration error: Missing Firebase service account credentials.');
          }
           console.log('[API_USERS_POST] FIREBASE_SERVICE_ACCOUNT variable found.');
          try {
            const serviceAccount = JSON.parse(serviceAccountString.replace(/\\n/g, '\n'));
             console.log('[API_USERS_POST] Service account JSON parsed successfully.');
            adminApp = initializeApp({ credential: cert(serviceAccount) });
          } catch(e) {
            console.error("[API_USERS_POST] CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
            throw new Error('Server configuration error: Invalid Firebase service account credentials.');
          }
      } else {
        adminApp = getApps()[0];
        console.log('[API_USERS_POST] Existing Firebase admin app found.');
      }

      const auth = getAuth(adminApp);
      console.log('[API_USERS_POST] Firebase admin auth instance obtained.');
      
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true,
      });
      console.log('[API_USERS_POST] Firebase user created successfully in Auth. UID:', userRecord.uid);
      
      const {password, ...restOfUserData} = userData;
      const dataToInsert = {
        ...restOfUserData,
        uid: userRecord.uid,
        createdAt: new Date(),
      };
      await usersCollection.insertOne(dataToInsert);
      console.log('[API_USERS_POST] Provider/Admin data inserted into MongoDB.');


      if (userData.role === 'provider') {
        await sendWelcomeEmail(userData.email, userData.name, userData.password);
        console.log('[API_USERS_POST] Welcome email sent to provider.');
      }
      
      return NextResponse.json(dataToInsert, {status: 201});
    }

    console.log('[API_USERS_POST] Warning: Request did not match any user role creation logic.');
    return NextResponse.json({message: 'Invalid user role specified.'}, {status: 400});

  } catch (error: any) {
    console.error('[API_USERS_POST_CATCH_BLOCK] An error occurred:', error);
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
