
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { to, subject, html } = emailSchema.parse(json);

    const fromAddress = 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from: `A+ Cleaning Solutions <${fromAddress}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ message: 'Error sending email', error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully', data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error in send-email route:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
