
import { NextResponse } from 'next/server';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const welcomeEmailSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const { name, email, password } = welcomeEmailSchema.parse(await req.json());

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    
    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/sign-in`;

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1>Welcome to A+ Cleaning Solutions, ${name}!</h1>
            <p>An administrator has created a provider account for you. You can now log in to the provider dashboard to manage your assigned jobs.</p>
            <p>Here are your login credentials:</p>
            <ul style="list-style-type: none; padding: 0; margin: 1rem 0; border: 1px solid #ddd; background-color: #f9f9f9; padding: 1rem;">
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

    await transporter.sendMail({
      from: `"A+ Cleaning Solutions" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Your New Provider Account with A+ Cleaning Solutions',
      html,
    });

    return NextResponse.json({ message: 'Provider welcome email sent successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid data', errors: error.errors }, { status: 400 });
    }
    console.error('Error sending provider welcome email:', error);
    return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
  }
}

    