
import { NextResponse } from 'next/server';
import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import clientPromise from '@/lib/mongodb';

const createProviderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(10),
  commissionPercentage: z.coerce.number().min(0).max(100),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createProviderSchema.parse(json);

    // 1. Create user in Firebase Authentication using the Admin SDK
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      emailVerified: true, // Providers created by admin are trusted
    });
    
    const client = await clientPromise;
    const db = client.db();

    // 2. Check if a user with this email or UID already exists in MongoDB
    const existingUser = await db.collection('users').findOne({ $or: [{ email: data.email }, { uid: userRecord.uid }] });
    if (existingUser) {
       // If a user exists, we should probably delete the one we just created in Firebase Auth to prevent orphans
       await admin.auth().deleteUser(userRecord.uid);
       return NextResponse.json({ message: 'A user with this email or UID already exists.' }, { status: 409 });
    }

    // 3. Create the provider profile in MongoDB
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
    await db.collection('users').insertOne(profileData);
    
    // Note: We are not sending a credentials email here as Firebase Auth handles this.
    // However, if custom emails are needed, this would be the place to trigger them.

    return NextResponse.json({ message: 'Provider account created successfully' }, { status: 201 });

  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ message: 'A user with this email already exists in Firebase.' }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating provider:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
