import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const bookingSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  email: z.string().email(),
  building: z.string(),
  floor: z.string().optional(),
  apartmentType: z.string().optional(),
  apartmentNumber: z.string().optional(),
  service: z.string(),
  roomCounts: z.object({
    standard: z.number(),
    deep: z.number(),
    'move-out': z.number(),
  }),
  date: z.string(), // Expecting 'yyyy-MM-dd'
  time: z.string(),
  frequency: z.string(),
  price: z.number(),
});

const updateBookingSchema = z.object({
    status: z.enum(['Aligned', 'In Process', 'Completed']).optional(),
    beforeImages: z.array(z.string()).optional(),
    afterImages: z.array(z.string()).optional(),
});


async function sendBookingConfirmationEmail(userId: string, bookingDetails: any) {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ uid: userId });

    if (!user) {
        console.error("Could not find user to email for booking confirmation");
        return;
    }

    const to = user.email;
    const subject = `Your Booking is Confirmed! (ID: ${bookingDetails.id.toString()})`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1>Booking Confirmed!</h1>
            <p>Hello ${user.name},</p>
            <p>Your cleaning service has been scheduled. Here are the details:</p>
            <ul style="list-style-type: none; padding: 0;">
                <li><strong>Service:</strong> ${bookingDetails.service}</li>
                <li><strong>Building:</strong> ${bookingDetails.building}</li>
                <li><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'})}</li>
                <li><strong>Time:</strong> ${bookingDetails.time}</li>
                <li><strong>Total Price:</strong> $${bookingDetails.price.toFixed(2)}</li>
            </ul>
            <p>Thank you for choosing A+ Cleaning Solutions!</p>
        </div>
    `;

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html }),
        });
        if (!response.ok) {
            console.error("Failed to send booking confirmation email:", await response.text());
        }
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
    }
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = bookingSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    // Find the building to determine the assigned provider.
    const buildingDoc = await db.collection('buildings').findOne({ name: data.building });
    let providerName = buildingDoc?.assignedProvider || 'Unassigned';

    const bookingData = {
      ...data,
      status: 'Aligned',
      provider: providerName,
      beforeImages: [],
      afterImages: [],
      createdAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(bookingData);
    
    // Send confirmation email
    await sendBookingConfirmationEmail(data.userId, { ...data, id: result.insertedId });

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