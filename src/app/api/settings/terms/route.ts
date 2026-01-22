import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { AppSetting } from '@/lib/types';

/**
 * GET → user dashboard + admin
 */
export async function GET() {
  const client = await clientPromise;
  const db = client.db();

  const setting = await db
    .collection<AppSetting>('settings')
    .findOne({ key: 'terms_and_conditions' });

  return NextResponse.json({
    content: setting?.value || '',
  });
}

/**
 * PUT → admin
 */
export async function PUT(req: Request) {
  const { content } = await req.json();

  const client = await clientPromise;
  const db = client.db();

  await db.collection<AppSetting>('settings').updateOne(
    { key: 'terms_and_conditions' },
    {
      $set: {
        value: content,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
