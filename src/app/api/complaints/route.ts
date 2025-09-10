import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const complaintSchema = z.object({
  userId: z.string(),
  user: z.string(),
  building: z.string(),
  complaint: z.string(),
  image: z.any().optional(),
  bookingId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = complaintSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    
    let providerName = 'Unassigned';

    // If a bookingId is provided, find the provider from the booking
    if (data.bookingId && ObjectId.isValid(data.bookingId)) {
        const booking = await db.collection('bookings').findOne({ _id: new ObjectId(data.bookingId) });
        if (booking && booking.provider) {
            providerName = booking.provider;
        }
    }

    const complaintData = {
      ...data,
      date: new Date(),
      status: 'Pending',
      provider: providerName, 
      lastResponseTimestamp: new Date(), // Set initial timestamp
    };

    const result = await db.collection('complaints').insertOne(complaintData);

    return NextResponse.json({ message: 'Complaint submitted successfully', id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating complaint:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const complaints = await db.collection('complaints').find({}).sort({ date: -1 }).toArray();
    
    return NextResponse.json(complaints, { status: 200 });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

