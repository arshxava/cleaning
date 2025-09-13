

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import admin from 'firebase-admin';
import { serviceAccount as serviceAccountCredentials } from '@/lib/firebase-admin-credentials';

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

type UserData = z.infer<typeof userSchema>;

async function sendProviderCredentialsEmail(email: string, password: string) {
  const subject = 'Your A+ Cleaning Solutions Provider Account has been created';
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/sign-in`;

  const html = `
    <h1>Welcome to A+ Cleaning Solutions!</h1>
    <p>An administrator has created a service provider account for you.</p>
    <p>You can now log in to your provider dashboard using these credentials:</p>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p>Please log in and change your password as soon as possible.</p>
    <a href="${loginUrl}" style="background-color: #90EE90; color: #000; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Log In to Your Dashboard
    </a>
    <p>If you have any questions, please contact the administration.</p>
    <p>Thanks,</p>
    <p>The A+ Cleaning Solutions Team</p>
  `;

  try {
    console.log(`Preparing to send provider credentials email to ${email}`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject, html }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API call to /api/send-email failed:", response.status, errorBody);
    } else {
        console.log("Provider credential email sent successfully via API call to:", email);
    }
  } catch (error) {
    console.error("Fetch call to /api/send-email failed:", error);
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  let originalJson;
  try {
    originalJson = await request.json();
    const submittedPassword = originalJson.password; 

    const userData = userSchema.parse(originalJson);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ email: userData.email });
    if (existing) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    
    let firebaseUid: string;

    const isAdminSdkInitialized = admin.apps.length > 0;
    if (!isAdminSdkInitialized && process.env.FIREBASE_ADMIN_SDK_ENABLED === 'true') {
        try {
            const serviceAccount = serviceAccountCredentials as admin.ServiceAccount;
            if (serviceAccount.private_key && !serviceAccount.private_key.includes("YOUR_PRIVATE_KEY_HERE")) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            } else {
                console.warn("Firebase Admin SDK not initialized: Placeholder or missing private key in firebase-admin-credentials.ts.");
                throw new Error("Admin SDK not configured.");
            }
        } catch(e: any) {
            console.error("Firebase Admin SDK initialization failed:", e.message);
            throw new Error("Could not initialize Firebase Admin.");
        }
    }
    
    if (admin.apps.length > 0 && submittedPassword) {
        try {
            const userRecord = await admin.auth().createUser({
                email: userData.email,
                password: submittedPassword,
                displayName: userData.name,
                emailVerified: userData.role !== 'user' // auto-verify providers/admins
            });
            firebaseUid = userRecord.uid;
        } catch(e: any) {
            console.error("Firebase Admin SDK user creation failed:", e);
             if (e.code === 'auth/email-already-exists') {
                return NextResponse.json({ message: 'A user with this email already exists in Firebase Authentication.' }, { status: 409 });
            }
            throw new Error("Failed to create user in Firebase.");
        }
    } else {
        throw new Error("Password is required to create a user account.");
    }
    
    const { password, ...rest } = userData;
    const dataToInsert = {
        ...rest,
        uid: firebaseUid, // Use the UID from Firebase
        createdAt: new Date(),
    };

    await usersCollection.insertOne(dataToInsert);

    if (userData.role === 'provider' && submittedPassword) {
        await sendProviderCredentialsEmail(userData.email, submittedPassword);
    }
    
    // For 'user' roles, the client will handle the email verification flow.
    // We return a success message here, and the client will redirect.
    return NextResponse.json({ message: 'User created successfully', uid: firebaseUid }, { status: 201 });


  } catch (error: any) {
    console.error('--- UNHANDLED ERROR in POST /api/users ---', error);
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ message: 'User with this email already exists in Firebase.' }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data provided', errors: error.errors }, { status: 400 });
    }

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

    