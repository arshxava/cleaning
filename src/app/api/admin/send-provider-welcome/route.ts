// import { NextResponse } from 'next/server';
// import { z } from 'zod';
// import sgMail from '@sendgrid/mail';

// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// const welcomeEmailSchema = z.object({
//   name: z.string(),
//   email: z.string().email(),
//   password: z.string(),
// });

// export async function POST(req: Request) {
//   try {
//     const { name, email, password } = welcomeEmailSchema.parse(await req.json());

//     const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/sign-in`;

//     const html = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//         <h1>Welcome to A+ Cleaning Solutions, ${name}!</h1>
//         <p>An administrator has created a provider account for you. You can now log in to the provider dashboard to manage your assigned jobs.</p>
//         <p>Here are your login credentials:</p>
//         <ul style="list-style-type: none; padding: 0; margin: 1rem 0; border: 1px solid #ddd; background-color: #f9f9f9; padding: 1rem;">
//           <li><strong>Email:</strong> ${email}</li>
//           <li><strong>Password:</strong> ${password}</li>
//         </ul>
//         <p>Please log in using the button below and change your password immediately.</p>
//         <p>
//           <a href="${loginUrl}" style="background-color: #90EE90; color: #000; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
//             Log In to Provider Dashboard
//           </a>
//         </p>
//         <p>Thanks,</p>
//         <p>The A+ Cleaning Solutions Team</p>
//       </div>
//     `;

//     const msg = {
//       to: email,
//       from: process.env.SENDGRID_FROM!, // Must be a verified sender in SendGrid
//       subject: 'Your New Provider Account with A+ Cleaning Solutions',
//       html,
//     };

//     await sgMail.send(msg);

//     return NextResponse.json({ message: 'Provider welcome email sent successfully' });
//   } catch (error: any) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
//     }
//     console.error('Error sending provider welcome email:', error);
//     return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
//   }
// }


// app/api/users/send-welcome-email/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';

// Set SendGrid API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Define schema for request body validation
const welcomeEmailSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const { name, email, password } = welcomeEmailSchema.parse(await req.json());

    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/sign-in`;

    // HTML content for welcome email
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>Welcome to A+ Cleaning Solutions, ${name}!</h1>
        <p>An administrator has created a provider account for you. You can now log in to the provider dashboard to manage your assigned jobs.</p>
        <p>Here are your login credentials:</p>
        <ul style="list-style-type: none; padding: 1rem; margin: 1rem 0; border: 1px solid #ddd; background-color: #f9f9f9;">
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>Please log in using the button below and change your password immediately.</p>
        <p>
          <a href="${loginUrl}" style="background-color: #90EE90; color: #000; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Log In to Provider Dashboard
          </a>
        </p>
        <p>Thanks,</p>
        <p>The A+ Cleaning Solutions Team</p>
      </div>
    `;

    // Email message object
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM!, // Verified sender
      subject: 'Your New Provider Account with A+ Cleaning Solutions',
      html,
    };

    // Send email
    await sgMail.send(msg);

    return NextResponse.json({ message: 'Provider welcome email sent successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error sending provider welcome email:', error);
    return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
  }
}
