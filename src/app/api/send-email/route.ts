
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { transporter } from '@/lib/nodemailer';

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { to, subject, html } = emailSchema.parse(json);

    const fromAddress = process.env.GMAIL_EMAIL;

    if (!fromAddress) {
       console.error('GMAIL_EMAIL environment variable not set.');
       return NextResponse.json({ message: 'Server configuration error: From address is not configured.' }, { status: 500 });
    }

    const mailOptions = {
        from: `A+ Cleaning Solutions <${fromAddress}>`,
        to: to,
        subject: subject,
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
        return NextResponse.json({ message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Nodemailer Error:', error);
        return NextResponse.json({ message: 'Error sending email', error: error.message }, { status: 500 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error in send-email route:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
