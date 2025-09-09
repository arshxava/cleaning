'use server';

import { analyzeComplaintResponseTime } from '@/ai/flows/complaint-response-time-analyzer';
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
