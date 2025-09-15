
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
    const subject = `New Complaint Submitted (Booking ID: ${complaintData.bookingId || 'N/A'})`;
    const adminEmail = process.env.ADMIN_EMAIL;

    // Email to Admin
    const adminBody = `
        <h1>New Complaint Received</h1>
        <p>A new complaint has been submitted. Please review it in the admin dashboard.</p>
        <p><strong>User:</strong> ${complaintData.user}</p>
        <p><strong>Building:</strong> ${complaintData.building}</p>
        <p><strong>Assigned Provider:</strong> ${complaintData.provider}</p>
        <p><strong>Complaint Details:</strong></p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0;">${complaintData.complaint}</blockquote>
        ${complaintData.imageUrl ? `<p><strong>Image Submitted:</strong> <a href="${complaintData.imageUrl}">View Image</a></p>` : ''}
        <hr>
        <p>You can manage this complaint here: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/complaints">Admin Complaints Dashboard</a></p>
    `;

    if (adminEmail) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: adminEmail, subject, html: adminBody }),
            });
        } catch (error) {
            console.error("Failed to send complaint email to admin:", error);
        }
    } else {
        console.warn("ADMIN_EMAIL environment variable is not set. Cannot send admin notification.");
    }


    // Email to Provider
    if (providerEmail) {
        const providerBody = `
            <h1>New Complaint Regarding Your Service</h1>
            <p>A new complaint has been submitted for a job you were assigned to. Please review and respond in your provider dashboard.</p>
            <p><strong>User:</strong> ${complaintData.user}</p>
            <p><strong>Building:</strong> ${complaintData.building}</p>
            <p><strong>Complaint Details:</strong></p>
            <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0;">${complaintData.complaint}</blockquote>
            ${complaintData.imageUrl ? `<p><strong>Image Submitted:</strong> <a href="${complaintData.imageUrl}">View Image</a></p>` : ''}
             <hr>
            <p>Please log in to respond: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/provider/dashboard">Provider Dashboard</a></p>
        `;
         try {
             await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: providerEmail, subject, html: providerBody }),
            });
        } catch (error) {
            console.error(`Failed to send complaint email to provider ${providerEmail}:`, error);
        }
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

    // If a bookingId is provided, find the associated provider
    if (data.bookingId && ObjectId.isValid(data.bookingId)) {
        const booking = await db.collection('bookings').findOne({ _id: new ObjectId(data.bookingId) });
        if (booking && booking.provider && booking.provider !== 'Unassigned') {
            providerName = booking.provider;
            // Find the provider's email from the users collection
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
      lastResponseTimestamp: new Date(), // Set initial timestamp for response tracking
    };

    const result = await db.collection('complaints').insertOne(complaintData);

    // Send notification emails to admin and provider
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
    
    // Convert ObjectId to string for all documents
    const formattedComplaints = complaints.map(c => ({
        ...c,
        _id: c._id.toString(),
        bookingId: c.bookingId ? c.bookingId.toString() : undefined,
    }));

    return NextResponse.json(formattedComplaints, { status: 200 });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
