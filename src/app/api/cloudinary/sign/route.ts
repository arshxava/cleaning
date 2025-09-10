
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    'Cloudinary environment variables are not fully set. Image uploads will fail.'
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({ timestamp, signature });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { message: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
