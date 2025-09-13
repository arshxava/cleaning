
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

// This schema defines the expected shape of the data for creating a user profile.
const profileSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  notificationPreference: z.enum(['email', 'sms']),
  school: z.string(),
  roomSize: z.string(),
  role: z.enum(['user', 'admin', 'provider']),
});

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
