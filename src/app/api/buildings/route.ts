
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const roomTypeSchema = z.object({
  name: z.string().min(1),
  count: z.coerce.number().min(1),
  prices: z.object({
    standard: z.coerce.number().min(0),
    deep: z.coerce.number().min(0),
    'move-out': z.coerce.number().min(0),
  }),
});

const buildingSchema = z.object({
  name: z.string().min(3),
  location: z.string().min(3),
  floors: z.coerce.number().min(1),
  roomTypes: z.array(roomTypeSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = buildingSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const buildingData = {
      ...data,
      createdAt: new Date(),
    };

    const result = await db.collection('buildings').insertOne(buildingData);

    return NextResponse.json({ message: 'Building added successfully', id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating building:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const buildings = await db.collection('buildings').find({}).sort({ name: 1 }).toArray();
    
    return NextResponse.json(buildings, { status: 200 });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
