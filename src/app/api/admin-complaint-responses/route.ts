
// import { NextResponse } from 'next/server';
// import clientPromise from '@/lib/mongodb';
// import { z } from 'zod';
// import { ObjectId } from 'mongodb';

// const adminResponseSchema = z.object({
//   complaintId: z.string(),
//   responseText: z.string().min(1),
//   adminName: z.string(),
//   userId: z.string(),
// });


// async function sendAdminComplaintResponseEmail(userId: string, responseText: string, complaintId: string, adminName: string) {
//     const client = await clientPromise;
//     const db = client.db();
//     const user = await db.collection('users').findOne({ uid: userId });

//     if (!user) {
//         console.error("Could not find user to email for complaint response");
//         return;
//     }

//     const to = user.email;
//     const subject = `Update on your complaint (ID: ${complaintId.slice(-6)})`;
//     const body = `
//         <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7f9; padding:30px;">
//   <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:32px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

//     <!-- Logo -->
//     <div style="text-align:center; margin-bottom:24px;">
//       <img
//         src="https://testingwebsitedesign.com/aplus-cleaning/wp-content/uploads/2026/01/ChatGPT_Imsd.png"
//         alt="A+ Cleaning Solutions"
//         style="max-width:170px; height:auto;"
//       />
//     </div>

//     <!-- Heading -->
//     <h2 style="color:#222; margin-bottom:12px;">
//       Response from the Admin Team
//     </h2>

//     <!-- Greeting -->
//     <p style="color:#555; margin-bottom:16px;">
//       Hello <strong>${user.name}</strong>,
//     </p>

//     <p style="color:#555; margin-bottom:20px;">
//       You’ve received a response from our support team regarding your recent complaint.
//       Please find the details below:
//     </p>

//     <!-- Response Box -->
//     <div style="background:#f9fafb; border-left:4px solid #111827; padding:16px; border-radius:6px; margin:20px 0;">
//       <p style="color:#333; margin:0; white-space:pre-line;">
//         ${responseText}
//       </p>
//     </div>

//     <p style="color:#555; margin-bottom:20px;">
//       This complaint has now been marked as <strong>resolved</strong>.
//       If you have any further questions or require additional assistance,
//       please feel free to contact our support team.
//     </p>

//     <!-- Footer -->
//     <p style="color:#555;">
//       Best regards,<br />
//       <strong>A+ Cleaning Solutions Team</strong>
//     </p>

//     <p style="color:#777; font-size:14px; margin-top:24px;">
//       This is an automated message. Please do not reply directly to this email.
//     </p>

//   </div>
// </div>

//     `;

//      try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ to, subject, html: body }),
//         });
//         if (!response.ok) {
//             console.error("Failed to send admin complaint response email:", await response.text());
//         }
//     } catch (error) {
//         console.error("Error sending admin complaint response email:", error);
//     }
// }


// export async function POST(request: Request) {
//   try {
//     const json = await request.json();
//     const data = adminResponseSchema.parse(json);

//     if (!ObjectId.isValid(data.complaintId)) {
//         return NextResponse.json({ message: 'Invalid complaint ID' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db();

//     // 1. Save the response to a collection
//     const responseData = {
//       complaintId: new ObjectId(data.complaintId),
//       responseText: data.responseText,
//       responder: 'admin',
//       responderName: data.adminName,
//       createdAt: new Date(),
//     };
//     await db.collection('complaint_responses').insertOne(responseData);

//     // 2. Update the original complaint status
//     const updateResult = await db.collection('complaints').updateOne(
//       { _id: new ObjectId(data.complaintId) },
//       { $set: { status: 'Resolved', lastResponseTimestamp: new Date() } }
//     );

//     if (updateResult.matchedCount === 0) {
//         return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
//     }

//     // 3. Send email to the user
//     await sendAdminComplaintResponseEmail(data.userId, data.responseText, data.complaintId, data.adminName);

//     return NextResponse.json({ message: 'Admin response recorded and email sent successfully' }, { status: 201 });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
//     }
//     console.error('Error creating admin complaint response:', error);
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }

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

async function sendAdminComplaintResponseEmail(
  userId: string,
  responseText: string,
  complaintId: string,
  adminName: string
) {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection('users').findOne({ uid: userId });

  if (!user) {
    console.error('Could not find user to email for complaint response');
    return;
  }

  // ✅ EMAIL PREFERENCE CHECK (ADDED)
  if (user.notifyByEmail !== true) {
    console.log('User opted out of emails. Skipping complaint response email.');
    return;
  }

  const to = user.email;
  const subject = `Update on your complaint (ID: ${complaintId.slice(-6)})`;

  const body = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7f9; padding:30px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:32px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

        <div style="text-align:center; margin-bottom:24px;">
          <img
            src="https://testingwebsitedesign.com/aplus-cleaning/wp-content/uploads/2026/01/ChatGPT_Imsd.png"
            alt="A+ Cleaning Solutions"
            style="max-width:170px; height:auto;"
          />
        </div>

        <h2 style="color:#222; margin-bottom:12px;">
          Response from the Admin Team
        </h2>

        <p style="color:#555; margin-bottom:16px;">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="color:#555; margin-bottom:20px;">
          You’ve received a response from our support team regarding your recent complaint.
          Please find the details below:
        </p>

        <div style="background:#f9fafb; border-left:4px solid #111827; padding:16px; border-radius:6px; margin:20px 0;">
          <p style="color:#333; margin:0; white-space:pre-line;">
            ${responseText}
          </p>
        </div>

        <p style="color:#555; margin-bottom:20px;">
          This complaint has now been marked as <strong>resolved</strong>.
          If you have any further questions or require additional assistance,
          please feel free to contact our support team.
        </p>

        <p style="color:#555;">
          Best regards,<br />
          <strong>A+ Cleaning Solutions Team</strong>
        </p>

        <p style="color:#777; font-size:14px; margin-top:24px;">
          This is an automated message. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html: body }),
    });

    if (!response.ok) {
      console.error('Failed to send admin complaint response email:', await response.text());
    }
  } catch (error) {
    console.error('Error sending admin complaint response email:', error);
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

    const responseData = {
      complaintId: new ObjectId(data.complaintId),
      responseText: data.responseText,
      responder: 'admin',
      responderName: data.adminName,
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

    // ✅ EMAIL SENT ONLY IF USER OPTED IN
    await sendAdminComplaintResponseEmail(
      data.userId,
      data.responseText,
      data.complaintId,
      data.adminName
    );

    return NextResponse.json(
      { message: 'Admin response recorded successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating admin complaint response:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
    