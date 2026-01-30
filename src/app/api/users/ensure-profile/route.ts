import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt'; // 👈 ADD

// Schema
const profileSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  password: z.string().optional(), // 👈 ADD
  phone: z.string(),
  notificationPreference: z.enum(['email']),
  school: z.string().optional(),
  roomSize: z.string().optional(),
  role: z.enum(['user', 'admin', 'provider']),
  commissionPercentage: z.number().optional(),
});

async function sendWelcomeEmail(email: string, name: string) {
  const subject = `Welcome to A+ Cleaning Solutions!`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color:#f7f7f7; padding:30px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:30px; border-radius:8px;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="https://testingwebsitedesign.com/aplus-cleaning/wp-content/uploads/2026/01/ChatGPT_Imsd.png" style="max-width:160px;" />
        </div>

        <h2>Welcome ${name} 👋</h2>
        <p>Your account has been created successfully.</p>
      </div>
    </div>
  `;

  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: email, subject, html }),
  });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = profileSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // 🔐 HASH PASSWORD
    let hashedPassword = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const result = await usersCollection.updateOne(
      { uid: data.uid },
      {
        $set: {
          uid: data.uid,
          name: data.name,
          email: data.email,
          password: hashedPassword, // 👈 STORED HASHED
          phone: data.phone,
          notificationPreference: data.notificationPreference,
          school: data.school,
          roomSize: data.roomSize,
          role: data.role,
          commissionPercentage: data.commissionPercentage,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0 && data.role === 'user') {
      await sendWelcomeEmail(data.email, data.name);
    }

    if (result.upsertedCount > 0) {
      return NextResponse.json({ message: 'Profile created successfully' }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
