
import { NextResponse } from 'next/server';
import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import clientPromise from '@/lib/mongodb';

const createProviderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(10),
  commissionPercentage: z.number().min(0).max(100),
});

async function sendProviderCredentialsEmail(email: string, password: string) {
  const subject = 'Your A+ Cleaning Solutions Provider Account has been created';
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/sign-in`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1 style="color: #333;">Welcome to A+ Cleaning Solutions!</h1>
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
    </div>
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
    }
  } catch (error) {
    console.error("Fetch call to /api/send-email failed:", error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createProviderSchema.parse(json);

    // 1. Create user in Firebase Auth using Admin SDK
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      emailVerified: true, // Providers are created by admin, so we can assume verified.
    });

    // 2. Create provider profile in MongoDB
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const profileData = {
        uid: userRecord.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notificationPreference: 'email',
        school: 'N/A', // Providers aren't tied to a school/building directly
        roomSize: 'N/A',
        role: 'provider',
        commissionPercentage: data.commissionPercentage,
        createdAt: new Date(),
    };

    await usersCollection.insertOne(profileData);
    
    // 3. Send credentials email
    await sendProviderCredentialsEmail(data.email, data.password);

    return NextResponse.json({ message: 'Provider account created successfully', uid: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    
    // Handle Firebase-specific errors
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    
    console.error('Error creating provider:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
