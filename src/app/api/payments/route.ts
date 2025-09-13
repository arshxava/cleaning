
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const paymentSchema = z.object({
  providerName: z.string(),
  bookingIds: z.array(z.string()),
  amount: z.number(),
  paymentDate: z.string().datetime(),
  invoiceRequestId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = paymentSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    // 1. Record the payment transaction
    const paymentData = {
      ...data,
      createdAt: new Date(),
    };
    await db.collection('payments').insertOne(paymentData);

    // 2. Update the bookings to mark them as paid to the provider
    const bookingObjectIds = data.bookingIds.map(id => new ObjectId(id));

    await db.collection('bookings').updateMany(
      { _id: { $in: bookingObjectIds } },
      { $set: { providerPaid: true } }
    );
    
    // 3. If an invoice request was associated, mark it as paid
    if (data.invoiceRequestId && ObjectId.isValid(data.invoiceRequestId)) {
      await db.collection('invoiceRequests').updateOne(
        { _id: new ObjectId(data.invoiceRequestId) },
        { $set: { status: 'paid' } }
      );
    }


    return NextResponse.json({ message: 'Payment recorded successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid payment data', errors: error.errors }, { status: 400 });
    }
    console.error('Error processing payment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const payments = await db.collection('payments').find({}).sort({ paymentDate: -1 }).toArray();
    
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
