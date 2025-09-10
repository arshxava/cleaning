
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const responseSchema = z.object({
  complaintId: z.string(),
  responseText: z.string().min(1),
  providerName: z.string(),
  userId: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = responseSchema.parse(json);

    if (!ObjectId.isValid(data.complaintId)) {
        return NextResponse.json({ message: 'Invalid complaint ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Insert the response
    const responseData = {
      ...data,
      complaintId: new ObjectId(data.complaintId),
      createdAt: new Date(),
    };
    await db.collection('complaint_responses').insertOne(responseData);

    // 2. Update the original complaint's status to 'Resolved'
    const updateResult = await db.collection('complaints').updateOne(
      { _id: new ObjectId(data.complaintId) },
      { $set: { status: 'Resolved', lastResponseTimestamp: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
        // This is unlikely if the ID is valid but good to handle
        return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }

    // Here you would trigger an email to the user.
    // For now, we are just storing the response.
    // e.g., await sendComplaintResponseEmail(data.userId, data.responseText);

    return NextResponse.json({ message: 'Response recorded successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating complaint response:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
