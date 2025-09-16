
'use server';

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function markComplaintAsResolved(complaintId: string) {
    if (!complaintId || !ObjectId.isValid(complaintId)) {
        return { success: false, error: 'Invalid complaint ID.' };
    }

    try {
        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('complaints').updateOne(
            { _id: new ObjectId(complaintId) },
            { $set: { status: 'Resolved', lastResponseTimestamp: new Date() } }
        );

        if (result.matchedCount === 0) {
            return { success: false, error: 'Complaint not found.' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error marking complaint as resolved:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
