
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.').optional(),
  notificationPreference: z.enum(['email', 'sms']).optional(),
  school: z.string().optional(),
  roomSize: z.string().optional(),
});


export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;

    const client = await clientPromise;
    const db = client.db();

    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ uid: uid });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    
    const json = await request.json();
    const data = updateUserSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('users').updateOne(
      { uid: uid },
      { $set: data }
    );
        
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
