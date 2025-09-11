
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const complaintSchema = z.object({
  userId: z.string(),
  user: z.string(),
  building: z.string(),
  complaint: z.string(),
  imageUrl: z.string().url().optional(),
  bookingId: z.string().optional(),
});

async function sendComplaintNotificationEmail(complaintData: any, providerEmail: string | undefined) {
    const subject = `New Complaint Submitted (ID: ${complaintData.bookingId || 'N/A'})`;
    const adminEmail = process.env.ADMIN_EMAIL;

    // Email to Admin
    const adminBody = `
        <h1>New Complaint Received</h1>
        <p><strong>User:</strong> ${complaintData.user}</p>
        <p><strong>Building:</strong> ${complaintData.building}</p>
        <p><strong>Provider:</strong> ${complaintData.provider}</p>
        <p><strong>Complaint:</strong></p>
        <p>${complaintData.complaint}</p>
        ${complaintData.imageUrl ? `<p><strong>Image:</strong> <a href="${complaintData.imageUrl}">View Image</a></p>` : ''}
        <p>View in admin dashboard: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/complaints">Dashboard</a></p>
    `;

    if (adminEmail) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: adminEmail, subject, html: adminBody }),
        });
    }


    // Email to Provider
    if (providerEmail) {
        const providerBody = `
            <h1>New Complaint Assigned to You</h1>
            <p>A new complaint has been submitted for a job you were assigned to.</p>
            <p><strong>User:</strong> ${complaintData.user}</p>
            <p><strong>Building:</strong> ${complaintData.building}</p>
            <p><strong>Complaint:</strong></p>
            <p>${complaintData.complaint}</p>
            ${complaintData.imageUrl ? `<p><strong>Image:</strong> <a href="${complaintData.imageUrl}">View Image</a></p>` : ''}
            <p>Please log in to your provider dashboard to respond: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/provider/dashboard">Dashboard</a></p>
        `;
         await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: providerEmail, subject, html: providerBody }),
        });
    }
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = complaintSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();
    
    let providerName = 'Unassigned';
    let providerEmail: string | undefined;

    if (data.bookingId && ObjectId.isValid(data.bookingId)) {
        const booking = await db.collection('bookings').findOne({ _id: new ObjectId(data.bookingId) });
        if (booking && booking.provider) {
            providerName = booking.provider;
            const providerUser = await db.collection('users').findOne({ name: providerName, role: 'provider' });
            if(providerUser) {
                providerEmail = providerUser.email;
            }
        }
    }

    const complaintData = {
      ...data,
      date: new Date(),
      status: 'Pending',
      provider: providerName, 
      lastResponseTimestamp: new Date(),
    };

    const result = await db.collection('complaints').insertOne(complaintData);

    // Send notification emails
    await sendComplaintNotificationEmail(complaintData, providerEmail);


    return NextResponse.json({ message: 'Complaint submitted successfully', id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating complaint:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const complaints = await db.collection('complaints').find({}).sort({ date: -1 }).toArray();
    
    return NextResponse.json(complaints, { status: 200 });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
