import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ uid: params.uid });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const json = await request.json();
    const data = updateUserSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('users').updateOne({ uid: params.uid }, { $set: data });
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
