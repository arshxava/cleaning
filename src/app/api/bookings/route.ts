// import { NextResponse } from 'next/server';
// import clientPromise from '@/lib/mongodb';
// import { z } from 'zod';
// import { ObjectId } from 'mongodb';

// const bookingSchema = z.object({
//   userId: z.string(),
//   userName: z.string(),
//   email: z.string().email(),
//   building: z.string(),
//   floor: z.string().optional(),
//   apartmentType: z.string().optional(),
//   apartmentNumber: z.string().optional(),
//   service: z.string(),
//   roomCounts: z.object({
//     standard: z.number(),
//     deep: z.number(),
//     'move-out': z.number(),
//   }),
//   date: z.string(), // Expecting 'yyyy-MM-dd'
//   time: z.string(),
//   frequency: z.string(),
//   price: z.number(),
// });

// const updateBookingSchema = z.object({
//     status: z.enum(['New Request', 'In Process', 'Completed']).optional(),
//     beforeImages: z.array(z.string()).optional(),
//     afterImages: z.array(z.string()).optional(),
// });


// async function sendBookingConfirmationEmail(userId: string, bookingDetails: any) {
//     const client = await clientPromise;
//     const db = client.db();
//     const user = await db.collection('users').findOne({ uid: userId });

//     if (!user) {
//         console.error("Could not find user to email for booking confirmation");
//         return;
//     }

//     const to = user.email;
//     const subject = `Your Booking is Confirmed! (ID: ${bookingDetails.id.toString()})`;
//     const html = `
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
//       Booking Confirmed ✅
//     </h2>

//     <!-- Greeting -->
//     <p style="color:#555; margin-bottom:16px;">
//       Hello <strong>${user.name}</strong>,
//     </p>

//     <p style="color:#555; margin-bottom:20px;">
//       Your cleaning service has been successfully scheduled. Below are the details
//       of your upcoming booking:
//     </p>

//     <!-- Booking Details -->
//     <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:16px; margin:20px 0;">
//       <table style="width:100%; border-collapse:collapse; font-size:15px;">
//         <tr>
//           <td style="padding:8px 0; color:#333;"><strong>Service</strong></td>
//           <td style="padding:8px 0; color:#555;">${bookingDetails.service}</td>
//         </tr>
//         <tr>
//           <td style="padding:8px 0; color:#333;"><strong>Building</strong></td>
//           <td style="padding:8px 0; color:#555;">${bookingDetails.building}</td>
//         </tr>
//         <tr>
//           <td style="padding:8px 0; color:#333;"><strong>Date</strong></td>
//           <td style="padding:8px 0; color:#555;">
//             ${new Date(bookingDetails.date).toLocaleDateString(
//               'en-US',
//               {
//                 weekday: 'long',
//                 year: 'numeric',
//                 month: 'long',
//                 day: 'numeric',
//                 timeZone: 'UTC'
//               }
//             )}
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:8px 0; color:#333;"><strong>Time</strong></td>
//           <td style="padding:8px 0; color:#555;">${bookingDetails.time}</td>
//         </tr>
//         <tr>
//           <td style="padding:8px 0; color:#333;"><strong>Total Price</strong></td>
//           <td style="padding:8px 0; color:#555;">
//             $${bookingDetails.price.toFixed(2)}
//           </td>
//         </tr>
//       </table>
//     </div>

//     <!-- Footer Message -->
//     <p style="color:#555; margin-bottom:20px;">
//       Our team will arrive as scheduled to provide you with a professional and
//       reliable cleaning service.
//     </p>

//     <p style="color:#555;">
//       Thank you for choosing <strong>A+ Cleaning Solutions</strong>. We look forward
//       to serving you!
//     </p>

//     <p style="color:#555; margin-top:20px;">
//       Best regards,<br />
//       <strong>A+ Cleaning Solutions Team</strong>
//     </p>

//   </div>
// </div>

//     `;

//     try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ to, subject, html }),
//         });
//         if (!response.ok) {
//             console.error("Failed to send booking confirmation email:", await response.text());
//         }
//     } catch (error) {
//         console.error("Error sending booking confirmation email:", error);
//     }
// }


// export async function POST(request: Request) {
//   try {
//     const json = await request.json();
//     const data = bookingSchema.parse(json);

//     const client = await clientPromise;
//     const db = client.db();

//     // Find the building to determine the assigned provider.
//     const buildingDoc = await db.collection('buildings').findOne({ name: data.building });
//     let providerName = buildingDoc?.assignedProvider || 'Unassigned';

//     const bookingData = {
//       ...data,
//       status: 'New Request',
//       provider: providerName,
//       beforeImages: [],
//       afterImages: [],
//       createdAt: new Date(),
//     };

//     const result = await db.collection('bookings').insertOne(bookingData);
    
//     // Send confirmation email
//     await sendBookingConfirmationEmail(data.userId, { ...data, id: result.insertedId });

//     return NextResponse.json({ message: 'Booking created successfully', id: result.insertedId }, { status: 201 });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
//     }
//     console.error('Error creating booking:', error);
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }

// export async function GET() {
//   try {
//     const client = await clientPromise;
//     const db = client.db();

//     const bookings = await db.collection('bookings').find({}).sort({ date: -1 }).toArray();
    
//     return NextResponse.json(bookings, { status: 200 });
//   } catch (error) {
//     console.error('Error fetching bookings:', error);
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }

// export async function PATCH(request: Request) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const id = searchParams.get('id');

//         if (!id || !ObjectId.isValid(id)) {
//             return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
//         }

//         const json = await request.json();
//         const data = updateBookingSchema.parse(json);

//         const client = await clientPromise;
//         const db = client.db();

//         const result = await db.collection('bookings').updateOne(
//             { _id: new ObjectId(id) },
//             { $set: data }
//         );
        
//         if (result.matchedCount === 0) {
//             return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
//         }

//         return NextResponse.json({ message: 'Booking updated successfully' }, { status: 200 });

//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
//         }
//         console.error('Error updating booking:', error);
//         return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//     }
// }


import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const bookingSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  email: z.string().email(),
  building: z.string(),
  floor: z.string().optional(),
  apartmentType: z.string().optional(),
  apartmentNumber: z.string().optional(),
  service: z.string(),
  roomCounts: z.object({
    standard: z.number(),
    deep: z.number(),
    'move-out': z.number(),
  }),
  date: z.string(),
  time: z.string(),
  frequency: z.string(),
  price: z.number(),
});

const updateBookingSchema = z.object({
  status: z.enum(['New Request', 'In Process', 'Completed']).optional(),
  beforeImages: z.array(z.string()).optional(),
  afterImages: z.array(z.string()).optional(),
});

async function sendBookingConfirmationEmail(userId: string, bookingDetails: any) {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection('users').findOne({ uid: userId });

  if (!user) {
    console.error('Could not find user to email for booking confirmation');
    return;
  }

  // ✅ EMAIL PREFERENCE CHECK (ADDED)
  if (user.notifyByEmail !== true) {
    console.log('User opted out of emails. Skipping booking confirmation email.');
    return;
  }

  const to = user.email;
  const subject = `Your Booking is Confirmed! (ID: ${bookingDetails.id.toString()})`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7f9; padding:30px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:32px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

        <div style="text-align:center; margin-bottom:24px;">
          <img
            src="https://testingwebsitedesign.com/aplus-cleaning/wp-content/uploads/2026/01/ChatGPT_Imsd.png"
            alt="A+ Cleaning Solutions"
            style="max-width:170px; height:auto;"
          />
        </div>

        <h2 style="color:#222; margin-bottom:12px;">Booking Confirmed ✅</h2>

        <p style="color:#555; margin-bottom:16px;">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="color:#555; margin-bottom:20px;">
          Your cleaning service has been successfully scheduled. Below are the details
          of your upcoming booking:
        </p>

        <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:16px; margin:20px 0;">
          <table style="width:100%; border-collapse:collapse; font-size:15px;">
            <tr>
              <td style="padding:8px 0;"><strong>Service</strong></td>
              <td style="padding:8px 0;">${bookingDetails.service}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;"><strong>Building</strong></td>
              <td style="padding:8px 0;">${bookingDetails.building}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;"><strong>Date</strong></td>
              <td style="padding:8px 0;">
                ${new Date(bookingDetails.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                })}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;"><strong>Time</strong></td>
              <td style="padding:8px 0;">${bookingDetails.time}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;"><strong>Total Price</strong></td>
              <td style="padding:8px 0;">$${bookingDetails.price.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="color:#555; margin-bottom:20px;">
          Our team will arrive as scheduled to provide you with a professional and
          reliable cleaning service.
        </p>

        <p style="color:#555;">
          Thank you for choosing <strong>A+ Cleaning Solutions</strong>.
        </p>

        <p style="color:#555; margin-top:20px;">
          Best regards,<br />
          <strong>A+ Cleaning Solutions Team</strong>
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      console.error('Failed to send booking confirmation email:', await response.text());
    }
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = bookingSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const buildingDoc = await db.collection('buildings').findOne({ name: data.building });
    const providerName = buildingDoc?.assignedProvider || 'Unassigned';

    const bookingData = {
      ...data,
      status: 'New Request',
      provider: providerName,
      beforeImages: [],
      afterImages: [],
      createdAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(bookingData);

    // ✅ EMAIL SENT ONLY IF USER OPTED IN
    await sendBookingConfirmationEmail(data.userId, { ...data, id: result.insertedId });

    return NextResponse.json(
      { message: 'Booking created successfully', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const bookings = await db.collection('bookings').find({}).sort({ date: -1 }).toArray();
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    const json = await request.json();
    const data = updateBookingSchema.parse(json);

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Booking updated successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error updating booking:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
