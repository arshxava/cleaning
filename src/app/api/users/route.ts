

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import admin from 'firebase-admin';

// This schema is for creating a provider record in the database.
// The Firebase user should already be created by the client (admin panel).
const providerSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.literal('provider'),
  commissionPercentage: z.coerce.number().optional(),
  password: z.string().optional(), // To trigger email sending
});


async function sendProviderCredentialsEmail(email: string, password: string) {
  console.log("Sending email to:", email)
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
    const data = providerSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    // Check if a user with this email already exists
    const existingUser = await db.collection('users').findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ message: 'A user with this email already exists.' }, { status: 409 });
    }
    
    // Check if a user with this UID already exists (shouldn't happen if Firebase creation is first)
     const existingUid = await db.collection('users').findOne({ uid: data.uid });
    if (existingUid) {
      return NextResponse.json({ message: 'A user with this UID already exists.' }, { status: 409 });
    }

    const profileData = {
        uid: data.uid,
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

    await db.collection('users').insertOne(profileData);
    
    // If a password was included, it's a signal to send the credentials email
    if (data.password) {
      await sendProviderCredentialsEmail(data.email, data.password);
    }

    return NextResponse.json({ message: 'Provider account created successfully' }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating provider profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

    