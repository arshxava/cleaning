
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const ensureProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const userData = ensureProfileSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existingProfile = await usersCollection.findOne({ uid: userData.uid });
    
    if (existingProfile) {
      // If profile already exists, just return it.
      return NextResponse.json(existingProfile);
    }

    // Profile does not exist, create a new one with default 'user' role.
    const newProfileData = {
      uid: userData.uid,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      role: 'user' as const, // Default role
      createdAt: new Date(),
      notificationPreference: 'email' as const,
      school: '',
      roomSize: '',
    };

    const result = await usersCollection.insertOne(newProfileData);
    
    const createdProfile = await usersCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(createdProfile, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data provided', errors: error.errors }, { status: 400 });
    }
    console.error('Error in ensure-profile route:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
