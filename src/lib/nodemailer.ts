import nodemailer from 'nodemailer';

const email = process.env.GMAIL_EMAIL;
const pass = process.env.GMAIL_APP_PASSWORD;

if (!email || !pass) {
  console.warn(
    'Gmail credentials are not fully set in .env.local. Email sending will fail.'
  );
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: email,
    pass: pass,
  },
});
