

// import { NextResponse } from 'next/server';
// import clientPromise from '@/lib/mongodb';
// import { z } from 'zod';
// import admin from '@/lib/firebase-admin';
// import { ObjectId } from 'mongodb';


// const updateUserSchema = z.object({
//   name: z.string().min(2).optional(),
//   phone: z.string().min(10).optional(),
//   notificationPreference: z.enum(['email', 'sms']).optional(),
//   school: z.string().optional(),
//   roomSize: z.string().optional(),
//   commissionPercentage: z.coerce.number().min(0).max(100).optional(),
// });

// export async function GET(
//   request: Request,
//   { params }: { params: { uid: string } }
// ) {
//   try {
//     const client = await clientPromise;
//     const db = client.db();

//     const user = await db.collection('users').findOne({ uid: params.uid });
//     if (!user) {
//       return NextResponse.json({ message: 'User not found' }, { status: 404 });
//     }

//     return NextResponse.json(user);
//   } catch (error) {
//     console.error(`Error fetching user ${params.uid}:`, error);
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }

// export async function PATCH(
//   request: Request,
//   { params }: { params: { uid: string } }
// ) {
//   try {
//     const json = await request.json();
//     const data = updateUserSchema.parse(json);

//     const client = await clientPromise;
//     const db = client.db();

//     const result = await db.collection('users').updateOne({ uid: params.uid }, { $set: data });
//     if (result.matchedCount === 0) {
//       return NextResponse.json({ message: 'User not found' }, { status: 404 });
//     }

//     return NextResponse.json({ message: 'Profile updated successfully' });
//   } catch (error: any) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
//     }
//     console.error(`Error updating user ${params.uid}:`, error);
//     return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
//   }
// }


// export async function DELETE(
//   request: Request,
//   { params }: { params: { uid: string } }
// ) {
//   const { uid } = params;
//   if (!uid) {
//     return NextResponse.json({ message: 'User UID is required' }, { status: 400 });
//   }

//   try {
//     const client = await clientPromise;
//     const db = client.db();

//     // 1. Delete from Firebase Authentication
//     await admin.auth().deleteUser(uid);

//     // 2. Delete from MongoDB
//     const result = await db.collection('users').deleteOne({ uid: uid });
//     if (result.deletedCount === 0) {
//       // Log this inconsistency but don't fail the request if Firebase deletion succeeded
//       console.warn(`User ${uid} deleted from Firebase Auth but not found in MongoDB.`);
//     }

//     return NextResponse.json({ message: 'User deleted successfully' });
//   } catch (error: any) {
//     console.error(`Error deleting user ${uid}:`, error);
//     if (error.code === 'auth/user-not-found') {
//       return NextResponse.json({ message: 'User not found in Firebase Authentication' }, { status: 404 });
//     }
//     return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from 'next/server';
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

// ✅ FIXED GET
export async function GET(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ uid: params.uid });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${params.uid}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ FIXED PATCH
export async function PATCH(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const json = await req.json();
    const data = updateUserSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('users').updateOne(
      { uid: params.uid },
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
    console.error(`Error updating user ${params.uid}:`, error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ FIXED DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const { uid } = params;
  if (!uid) {
    return NextResponse.json({ message: 'User UID is required' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Delete from Firebase
    await admin.auth().deleteUser(uid);

    // Delete from MongoDB
    const result = await db.collection('users').deleteOne({ uid });
    if (result.deletedCount === 0) {
      console.warn(`User ${uid} deleted from Firebase but not found in MongoDB.`);
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting user ${uid}:`, error);
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ message: 'User not found in Firebase Authentication' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
