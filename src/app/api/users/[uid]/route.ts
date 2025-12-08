import { NextRequest, NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import admin from '@/lib/firebase-admin';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  notificationPreference: z.enum(['email', 'sms']).optional(),
  school: z.string().optional(),
  roomSize: z.string().optional(),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
});

// Helper to extract UID from URL
function extractUid(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
}

// ---------------- GET ----------------
export async function GET(req: NextRequest) {
  try {
    const uid = extractUid(req);

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ uid });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------- PATCH ----------------
export async function PATCH(req: NextRequest) {
  try {
    const uid = extractUid(req);
    const json = await req.json();
    const data = updateUserSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('users').updateOne(
      { uid },
      { $set: data }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// ---------------- DELETE ----------------
export async function DELETE(req: NextRequest) {
  try {
    const uid = extractUid(req);

    if (!uid) {
      return NextResponse.json({ message: 'User UID is required' }, { status: 400 });
    }

    // Firebase delete
    await admin.auth().deleteUser(uid);

    // Mongo delete
    const client = await clientPromise;
    const db = client.db();

    await db.collection('users').deleteOne({ uid });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ message: 'User not found in Firebase' }, { status: 404 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
