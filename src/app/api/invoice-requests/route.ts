
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const requestSchema = z.object({
  providerId: z.string(),
  providerName: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = requestSchema.parse(json);
    
    const client = await clientPromise;
    const db = client.db();

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Check if a request for the current month already exists
    const existingRequest = await db.collection('invoiceRequests').findOne({
        providerId: data.providerId,
        month: month,
        year: year,
    });

    if (existingRequest) {
        return NextResponse.json({ message: 'An invoice for this month has already been requested.' }, { status: 409 });
    }

    const requestData = {
      ...data,
      requestDate: now,
      status: 'pending',
      month: month,
      year: year,
    };

    const result = await db.collection('invoiceRequests').insertOne(requestData);

    return NextResponse.json({ message: 'Invoice request submitted successfully', id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating invoice request:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const client = await clientPromise;
    const db = client.db();

    const query: { status?: string } = {};
    if (status) {
      query.status = status;
    }

    const requests = await db.collection('invoiceRequests').find(query).sort({ requestDate: -1 }).toArray();
    
    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoice requests:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
