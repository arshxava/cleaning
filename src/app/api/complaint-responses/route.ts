
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


async function sendComplaintResponseEmail(userId: string, responseText: string, complaintId: string) {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ uid: userId });

    if (!user) {
        console.error("Could not find user to email for complaint response");
        return;
    }

    const to = user.email;
    const subject = `Update on your complaint (ID: ${complaintId})`;
    const body = `
        <h1>Response from your service provider</h1>
        <p>Hello ${user.name},</p>
        <p>You have received a response regarding your recent complaint:</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 1rem;">
            ${responseText}
        </blockquote>
        <p>The complaint has now been marked as resolved. If you have further questions, please contact support.</p>
        <p>Thanks,</p>
        <p>The A+ Cleaning Solutions Team</p>
    `;

     try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html: body }),
        });
        if (!response.ok) {
            console.error("Failed to send complaint response email:", await response.text());
        }
    } catch (error) {
        console.error("Error sending complaint response email:", error);
    }
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = responseSchema.parse(json);

    if (!ObjectId.isValid(data.complaintId)) {
        return NextResponse.json({ message: 'Invalid complaint ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const responseData = {
      ...data,
      complaintId: new ObjectId(data.complaintId),
      createdAt: new Date(),
    };
    await db.collection('complaint_responses').insertOne(responseData);

    const updateResult = await db.collection('complaints').updateOne(
      { _id: new ObjectId(data.complaintId) },
      { $set: { status: 'Resolved', lastResponseTimestamp: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
        return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }

    // Send email to the user
    await sendComplaintResponseEmail(data.userId, data.responseText, data.complaintId);

    return NextResponse.json({ message: 'Response recorded successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating complaint response:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
