
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject, html }),
    });

    if (!response.ok) {
      console.error("Failed to send provider credential email:", await response.text());
    } else {
        console.log("Provider credential email sent successfully to:", email);
    }
  } catch (error) {
    console.error("Error sending provider credential email:", error);
  }
}

export async function POST(request: Request) {
  console.log("POST /api/users request received.");
  try {
    const json = await request.json();
    console.log("Request JSON payload:", json);

    const userData = userSchema.parse(json);
    console.log("Parsed user data with Zod:", userData);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ email: userData.email });
    if (existing) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Regular user signup flow
    if (userData.role === 'user') {
      if (!userData.uid) {
        return NextResponse.json({ message: 'User UID is required for standard signup.' }, { status: 400 });
      }
      const { password, ...restOfUserData } = userData;
      const dataToInsert = { ...restOfUserData, createdAt: new Date() };
      await usersCollection.insertOne(dataToInsert);
      return NextResponse.json(dataToInsert, { status: 201 });
    }

    // Admin or Provider creation flow (requires Firebase Admin SDK)
    if (userData.role === 'provider' || userData.role === 'admin') {
      console.log(`Entering ${userData.role} creation flow.`);

      let app;
      try {
          console.log("Initializing Firebase Admin SDK...");
          const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
          if (!serviceAccountString) {
              throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
          }
          const serviceAccount = JSON.parse(serviceAccountString.replace(/\\n/g, '\n'));

          if (!getApps().length) {
              app = initializeApp({
                  credential: credential.cert(serviceAccount)
              });
          } else {
              app = getApps()[0];
          }
          console.log("Firebase Admin SDK initialized successfully.");
      } catch (e: any) {
          console.error("CRITICAL: Firebase Admin SDK initialization failed.", e.message);
          return NextResponse.json({ message: 'Internal Server Error: Could not initialize admin services.' }, { status: 500 });
      }


      if (!userData.password) {
        return NextResponse.json({ message: 'Password is required to create a provider/admin account.' }, { status: 400 });
      }

      const auth = getAuth(app);
      console.log("Creating user in Firebase Auth...");
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true, // Providers/admins created by an admin are trusted.
      });
      console.log("Successfully created Firebase user with UID:", userRecord.uid);
      
      const { password, ...rest } = userData;
      const dataToInsert = {
        ...rest,
        uid: userRecord.uid,
        createdAt: new Date(),
      };

      console.log("Inserting user profile into MongoDB:", dataToInsert);
      await usersCollection.insertOne(dataToInsert);
      console.log("Successfully inserted user profile into MongoDB.");

      // Send credentials email to the new provider
      if (userData.role === 'provider') {
        console.log("Sending credentials email to new provider...");
        await sendProviderCredentialsEmail(userData.email, userData.password);
      }

      // Cleanup the temporary app instance if we created one
      if (getApps().length > 1) { // Be careful if other parts of the app use admin
        await deleteApp(app);
        console.log("Cleaned up temporary Firebase Admin app instance.");
      }

      return NextResponse.json(dataToInsert, { status: 201 });
    }

    return NextResponse.json({ message: 'Invalid role specified' }, { status: 400 });

  } catch (error: any) {
    console.error('--- UNHANDLED ERROR in POST /api/users ---');
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Error:", error.errors);
      return NextResponse.json({ message: 'Invalid data provided', errors: error.errors }, { status: 400 });
    }
    console.error("Generic Error:", error);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
