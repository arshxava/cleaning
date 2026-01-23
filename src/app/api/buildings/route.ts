
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

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
  type: z.enum(['school', 'building']), // ✅ REQUIRED
  name: z.string().min(3),
  location: z.string().min(3),
  // floors: z.coerce.number().min(1),
  roomTypes: z.array(roomTypeSchema).min(1),
});


const updateProviderSchema = z.object({
  buildingId: z.string(),
  providerName: z.string(),
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

    const buildings = await db.collection('buildings')
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Convert ObjectId to string
    const formatted = buildings.map(b => ({
      ...b,
      _id: b._id.toString(),
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const { buildingId, providerName } = updateProviderSchema.parse(json);
    
    if (!ObjectId.isValid(buildingId)) {
        return NextResponse.json({ message: 'Invalid building ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('buildings').updateOne(
        { _id: new ObjectId(buildingId) },
        { $set: { assignedProvider: providerName } }
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ message: 'Building not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Provider assigned successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error assigning provider:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid building ID' }, { status: 400 });
    }

    const json = await request.json();
    const data = buildingSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('buildings').updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
    );
    
    if (result.matchedCount === 0) {
        return NextResponse.json({ message: 'Building not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Building updated successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error updating building:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid building ID' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('buildings').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: 'Building not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Building deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting building:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
