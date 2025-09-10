import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const userSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  notificationPreference: z.enum(['email', 'sms']),
  school: z.string(),
  roomSize: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const userData = userSchema.parse(json);

    const client = await clientPromise;
    const db = client.db(); // Use the default DB from connection string

    const usersCollection = db.collection('users');
    
    // Ensure the uid is used as the document's primary key
    const { uid, ...restOfUserData } = userData;

    const result = await usersCollection.insertOne({
        _id: uid, // Use Firebase UID as the document ID
        uid: uid,
        ...restOfUserData,
        createdAt: new Date(),
    });

    return NextResponse.json({ message: 'User created successfully', userId: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid user data', errors: error.errors }, { status: 400 });
    }
    // Handle potential duplicate key error if a user with the same _id (uid) already exists
    if (error instanceof Error && (error as any).code === 11000) {
        return NextResponse.json({ message: 'User with this UID already exists.' }, { status: 409 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
