
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const adminResponseSchema = z.object({
  complaintId: z.string(),
  responseText: z.string().min(1),
  adminName: z.string(),
  userId: z.string(),
});


async function sendAdminComplaintResponseEmail(userId: string, responseText: string, complaintId: string, adminName: string) {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ uid: userId });

    if (!user) {
        console.error("Could not find user to email for complaint response");
        return;
    }

    const to = user.email;
    const subject = `Update on your complaint (ID: ${complaintId.slice(-6)})`;
    const body = `
        <h1>Response from the Admin Team</h1>
        <p>Hello ${user.name},</p>
        <p>You have received a response from our support team regarding your recent complaint:</p>
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
            console.error("Failed to send admin complaint response email:", await response.text());
        }
    } catch (error) {
        console.error("Error sending admin complaint response email:", error);
    }
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = adminResponseSchema.parse(json);

    if (!ObjectId.isValid(data.complaintId)) {
        return NextResponse.json({ message: 'Invalid complaint ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Save the response to a collection
    const responseData = {
      complaintId: new ObjectId(data.complaintId),
      responseText: data.responseText,
      responder: 'admin',
      responderName: data.adminName,
      createdAt: new Date(),
    };
    await db.collection('complaint_responses').insertOne(responseData);

    // 2. Update the original complaint status
    const updateResult = await db.collection('complaints').updateOne(
      { _id: new ObjectId(data.complaintId) },
      { $set: { status: 'Resolved', lastResponseTimestamp: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
        return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }

    // 3. Send email to the user
    await sendAdminComplaintResponseEmail(data.userId, data.responseText, data.complaintId, data.adminName);

    return NextResponse.json({ message: 'Admin response recorded and email sent successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating admin complaint response:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

    