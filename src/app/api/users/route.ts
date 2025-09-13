
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import admin from 'firebase-admin';
import { serviceAccount } from '@/lib/firebase-admin-credentials';

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

async function sendProviderCredentialsEmail(email: string, password: string) {
  console.log(`Preparing to send provider credentials email to ${email}`);
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
  console.log("POST /api/users request received.");
  try {
    const json = await request.json();
    const userData = userSchema.parse(json);
    console.log("User data parsed successfully:", { name: userData.name, email: userData.email, role: userData.role });

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ email: userData.email });
    if (existing) {
      console.warn("Attempted to create a user with an existing email:", userData.email);
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    if (userData.role === 'user') {
      console.log("Processing 'user' role creation.");
      if (!userData.uid) {
        return NextResponse.json({ message: 'User UID is required for standard signup.' }, { status: 400 });
      }
      const { password, ...restOfUserData } = userData;
      const dataToInsert = { ...restOfUserData, createdAt: new Date() };
      await usersCollection.insertOne(dataToInsert);
      console.log("Successfully created 'user' in database.");
      return NextResponse.json(dataToInsert, { status: 201 });
    }

    if (userData.role === 'provider' || userData.role === 'admin') {
      console.log(`Processing '${userData.role}' role creation.`);
      let firebaseUid: string | undefined = undefined;

      const isAdminSdkEnabled = process.env.FIREBASE_ADMIN_SDK_ENABLED === 'true';
      if (isAdminSdkEnabled) {
        try {
          if (!admin.apps.length) {
            console.log("Initializing Firebase Admin SDK...");
             if (serviceAccount.private_key.includes("YOUR_PRIVATE_KEY_HERE")) {
                console.warn("Placeholder private key detected in firebase-admin-credentials.ts. Firebase Admin SDK will not be initialized.");
             } else {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("Firebase Admin SDK initialized successfully.");
             }
          }

          if (admin.apps.length > 0 && userData.password) {
            console.log("Creating user in Firebase Auth...");
            const userRecord = await admin.auth().createUser({
              email: userData.email,
              password: userData.password,
              displayName: userData.name,
              emailVerified: true,
            });
            console.log("Successfully created user in Firebase Auth with UID:", userRecord.uid);
            firebaseUid = userRecord.uid;
          }

        } catch (e: any) {
          console.error("CRITICAL: Firebase Admin SDK operation failed.", e.message);
        }
      } else {
        console.warn("FIREBASE_ADMIN_SDK_ENABLED is not 'true'. Skipping Firebase Auth user creation.");
      }

      const { password, ...rest } = userData;
      const dataToInsert = {
        ...rest,
        uid: firebaseUid || `temp_${new Date().getTime()}`,
        createdAt: new Date(),
      };

      await usersCollection.insertOne(dataToInsert);
      console.log("Successfully inserted provider/admin into database.");

      if (userData.password && userData.role === 'provider') {
        console.log("Triggering credential email to provider.");
        await sendProviderCredentialsEmail(userData.email, userData.password);
      }
      
      return NextResponse.json(dataToInsert, { status: 201 });
    }

    return NextResponse.json({ message: 'Invalid role specified' }, { status: 400 });

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
