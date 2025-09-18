

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import admin from 'firebase-admin';

// This schema defines the expected shape of the data for creating a user profile.
const profileSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  notificationPreference: z.enum(['email']),
  school: z.string().optional(),
  roomSize: z.string().optional(),
  role: z.enum(['user', 'admin', 'provider']),
  commissionPercentage: z.number().optional(),
});

async function sendWelcomeEmail(email: string, name: string) {
     const subject = `Welcome to A+ Cleaning Solutions!`;
     const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1 style="color: #333;">Welcome, ${name}!</h1>
        <p>Thank you for signing up for A+ Cleaning Solutions. Your account has been created successfully.</p>
        <p>You can now log in and start booking our cleaning services.</p>
        <p>If you did not create an account, no further action is required.</p>
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
             console.error("API call to /api/send-email failed for welcome email:", response.status, errorBody);
        }
    } catch(error) {
        console.error("Fetch call to /api/send-email failed for welcome email:", error);
    }
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = profileSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Use `updateOne` with `upsert: true` to either create the profile or update it if it exists.
    // This prevents race conditions and handles cases where a profile might already exist.
    const result = await usersCollection.updateOne(
      { uid: data.uid },
      {
        $set: {
          ...data,
        },
        $setOnInsert: { // Only set createdAt on the first insertion
            createdAt: new Date(),
        }
      },
      { upsert: true }
    );
    
    // If a new user profile was created, send the welcome email.
    if (result.upsertedCount > 0 && data.role === 'user') {
        await sendWelcomeEmail(data.email, data.name);
    }


    if (result.upsertedCount > 0) {
      return NextResponse.json({ message: 'Profile created successfully' }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Profile already existed or was updated' }, { status: 200 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data provided', errors: error.errors }, { status: 400 });
    }
    console.error('Error in ensure-profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
