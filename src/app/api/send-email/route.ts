
// import { NextResponse } from 'next/server';
// import { z } from 'zod';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// const emailSchema = z.object({
//   to: z.string().email(),
//   subject: z.string(),
//   html: z.string(),
// });

// export async function POST(request: Request) {
//   try {
//     const json = await request.json();
//     const { to, subject, html } = emailSchema.parse(json);

//     const fromAddress = process.env.FROM_EMAIL;

//     if (!fromAddress) {
//        console.error('FROM_EMAIL environment variable not set.');
//        return NextResponse.json({ message: 'Server configuration error: From address is not configured.' }, { status: 500 });
//     }

//     const { data, error } = await resend.emails.send({
//         from: `A+ Cleaning Solutions <${fromAddress}>`,
//         to: [to],
//         subject: subject,
//         html: html,
//     });

//     if (error) {
//         console.error('Resend Error:', error);
//         return NextResponse.json({ message: 'Error sending email', error: error.message }, { status: 500 });
//     }

//     return NextResponse.json({ message: 'Email sent successfully', data });

//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
//     }
//     console.error('Error in send-email route:', error);
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }

// ✅ NEW FILE - move email sending here
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"A+ Cleaning Solutions" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json({ message: "Failed to send email", error: error.message }, { status: 500 });
  }
}

