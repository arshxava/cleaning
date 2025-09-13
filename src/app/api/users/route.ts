
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
  try {
    const json = await request.json();
    const userData = userSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ email: userData.email });
    if (existing) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    if (userData.role === 'user') {
      if (!userData.uid) {
        return NextResponse.json({ message: 'User UID is required for standard signup.' }, { status: 400 });
      }
      const { password, ...restOfUserData } = userData;
      const dataToInsert = { ...restOfUserData, createdAt: new Date() };
      await usersCollection.insertOne(dataToInsert);
      return NextResponse.json(dataToInsert, { status: 201 });
    }

    if (userData.role === 'provider' || userData.role === 'admin') {
      let app: App;
      if (!getApps().length) {
        // Using Application Default Credentials
        app = initializeApp();
      } else {
        app = getApps()[0];
      }

      if (!userData.password) {
        return NextResponse.json({ message: 'Password is required to create a provider/admin account.' }, { status: 400 });
      }

      const auth = getAuth(app);
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true, 
      });
      
      const { password, ...rest } = userData;
      const dataToInsert = {
        ...rest,
        uid: userRecord.uid,
        createdAt: new Date(),
      };

      await usersCollection.insertOne(dataToInsert);

      if (userData.role === 'provider') {
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
