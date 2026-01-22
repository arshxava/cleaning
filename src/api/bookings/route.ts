

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const bookingSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  building: z.string(),
  // floor: z.string().optional(),
  apartmentType: z.string().optional(),
  apartmentNumber: z.string().optional(),
  service: z.string(),
  roomCounts: z.object({
    standard: z.number(),
    deep: z.number(),
    'move-out': z.number(),
  }),
  paymentIntentId: z.string(),
  date: z.string(), // Expecting 'yyyy-MM-dd'
  time: z.string(),
  frequency: z.string(),
  price: z.number(),
});

const updateBookingSchema = z.object({
    status: z.enum(['New Request', 'In Process', 'Completed']).optional(),
    beforeImages: z.array(z.string()).optional(),
    afterImages: z.array(z.string()).optional(),
});


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = bookingSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    // Find the building to determine the assigned provider.
    const buildingDoc = await db.collection('buildings').findOne({ name: data.building });
    let providerName = buildingDoc?.assignedProvider || 'Unassigned';

    // const bookingData = {
    //   ...data,
    //   status: 'New Request',
    //   provider: providerName,
    //   beforeImages: [],
    //   afterImages: [],
    //   createdAt: new Date(),
    // };

    const bookingData = {
      ...data,
      status: 'New Request',
      paymentStatus: 'paid',
      provider: providerName,
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

// export async function GET() {
//   try {
//     const client = await clientPromise;
//     const db = client.db();

//     const bookings = await db.collection('bookings').find({}).sort({ date: -1 }).toArray();
    
//     return NextResponse.json(bookings, { status: 200 });
//   } catch (error) {
//     console.error('Error fetching bookings:', error);
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }


// /api/bookings/route.ts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentStatus = searchParams.get("paymentStatus");

    const client = await clientPromise;
    const db = client.db();

    const query: any = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const bookings = await db
      .collection("bookings")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(bookings);
  } catch (err) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
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
