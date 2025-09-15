'use server';

import { analyzeComplaintResponseTime } from '@/ai/flows/complaint-response-time-analyzer';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const AnalyzeSchema = z.object({
  complaintText: z.string(),
  timeSinceLastResponse: z.number(),
});

export async function getComplaintAnalysis(formData: FormData) {
  try {
    const data = AnalyzeSchema.parse({
      complaintText: formData.get('complaintText'),
      timeSinceLastResponse: Number(formData.get('timeSinceLastResponse')),
    });
    
    const result = await analyzeComplaintResponseTime(data);
    
    return { success: true, data: result };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data." };
    }
    console.error('Error in getComplaintAnalysis:', error);
    return { success: false, error: 'An unexpected error occurred while analyzing the complaint.' };
  }
}

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
