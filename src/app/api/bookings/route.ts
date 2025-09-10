
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const bookingSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  building: z.string(),
  roomType: z.string(),
  service: z.string(),
  date: z.string(), // Expecting 'yyyy-MM-dd'
  time: z.string(),
  frequency: z.string(),
});

const updateBookingSchema = z.object({
    status: z.enum(['Aligned', 'In Process', 'Completed']).optional(),
    beforeImages: z.array(z.string()).optional(),
    afterImages: z.array(z.string()).optional(),
});


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = bookingSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const buildings = await db.collection('buildings').find({}).toArray();
    const assignedProvider = buildings.length > 0 ? (await db.collection('users').findOne({ role: 'provider', assignedBuildings: data.building })) : null;

    const bookingData = {
      ...data,
      status: 'Aligned',
      provider: assignedProvider ? assignedProvider.name : 'Unassigned', // Assign provider or mark as unassigned
      beforeImages: [],
      afterImages: [],
      createdAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(bookingData);

    return NextResponse.json({ message: 'Booking created successfully', id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const bookings = await db.collection('bookings').find({}).sort({ date: -1 }).toArray();
    
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
        }

        const json = await request.json();
        const data = updateBookingSchema.parse(json);

        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('bookings').updateOne(
            { _id: new ObjectId(id) },
            { $set: data }
        );
        
        if (result.matchedCount === 0) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Booking updated successfully' }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
        }
        console.error('Error updating booking:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
