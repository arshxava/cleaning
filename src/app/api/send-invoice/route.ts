
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const invoiceEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  pdfAttachment: z.object({
    filename: z.string(),
    content: z.string(), // Base64 encoded string
  }),
});

export async function POST(req: Request) {
  try {
    const { to, subject, html, pdfAttachment } = invoiceEmailSchema.parse(await req.json());

    if (!to || !subject || !html || !pdfAttachment) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
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
      attachments: [
        {
          filename: pdfAttachment.filename,
          content: pdfAttachment.content,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({ message: 'Invoice email sent successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error sending invoice email:', error);
    return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
  }
}
