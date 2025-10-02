import { NextResponse } from 'next/server';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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

    const msg = {
      to,
      from: process.env.SENDGRID_FROM!, // Must be a verified sender in SendGrid
      subject,
      html,
      attachments: [
        {
          content: pdfAttachment.content,
          filename: pdfAttachment.filename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: 'Invoice email sent successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error sending invoice email:', error.response?.body || error);
    return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
  }
}
