

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import admin from 'firebase-admin';

// This schema is specifically for creating a provider, as general user signup
// is now handled via the client-side flow + ensure-profile endpoint.
const providerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(), 
  phone: z.string(),
  role: z.literal('provider'), // Ensures this endpoint is only for providers
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
  // This endpoint is now primarily for creating provider accounts from the admin panel.
  try {
    const originalJson = await request.json();
    const submittedPassword = originalJson.password; 
    
    // Only providers should be created via this endpoint now.
    if (originalJson.role !== 'provider') {
        return NextResponse.json({ message: 'This endpoint is for provider creation only.' }, { status: 403 });
    }

    const userData = providerSchema.parse(originalJson);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ email: userData.email });
    if (existing) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    
    // The client-side (admin panel) will create the Firebase Auth user
    // and then call this endpoint to create the DB record. This is a temporary
    // simplification to avoid server-side Firebase Admin SDK issues.
    // A more robust solution would re-introduce the Admin SDK carefully.

    // For now, we assume the UID will be added when the profile is created/updated.
    // The admin panel will need to be adjusted to create the Firebase user first.
    // This POST route will now just create the DB record.

    // Let's assume the client will create the Firebase User and pass the UID
    const { password, ...rest } = userData;
    const dataToInsert = {
        ...rest,
        // uid: client-provided-uid, // This needs to be implemented on the client
        createdAt: new Date(),
    };

    await usersCollection.insertOne(dataToInsert);

    if (submittedPassword) {
        await sendProviderCredentialsEmail(userData.email, submittedPassword);
    }
    
    return NextResponse.json({ message: 'Provider database record created successfully' }, { status: 201 });


  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data provided', errors: error.errors }, { status: 400 });
    }

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
