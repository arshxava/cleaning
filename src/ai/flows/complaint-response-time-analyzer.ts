'use server';
/**
 * @fileOverview Analyzes complaint text and flags/reminds responsible parties if no response is detected within 24 hours.
 *
 * - analyzeComplaintResponseTime - A function that analyzes the complaint and triggers reminders if needed.
 * - AnalyzeComplaintInput - The input type for the analyzeComplaintResponseTime function.
 * - AnalyzeComplaintOutput - The return type for the analyzeComplaintResponseTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeComplaintInputSchema = z.object({
  complaintText: z.string().describe('The text content of the user complaint.'),
  lastResponseTimestamp: z.number().optional().describe('Timestamp of the last response to the complaint, if any.'),
  timeSinceLastResponse: z.number().optional().describe('Time since the last response in hours.'),
});
export type AnalyzeComplaintInput = z.infer<typeof AnalyzeComplaintInputSchema>;

const AnalyzeComplaintOutputSchema = z.object({
  needsReminder: z.boolean().describe('Whether a reminder needs to be sent to the responsible parties.'),
  reason: z.string().optional().describe('The reason for needing a reminder, if applicable.'),
});
export type AnalyzeComplaintOutput = z.infer<typeof AnalyzeComplaintOutputSchema>;

export async function analyzeComplaintResponseTime(input: AnalyzeComplaintInput): Promise<AnalyzeComplaintOutput> {
  return analyzeComplaintResponseTimeFlow(input);
}

const analyzeComplaintResponseTimePrompt = ai.definePrompt({
  name: 'analyzeComplaintResponseTimePrompt',
  input: {schema: AnalyzeComplaintInputSchema},
  output: {schema: AnalyzeComplaintOutputSchema},
  prompt: `You are an AI assistant tasked with analyzing user complaints and determining if a reminder needs to be sent to the responsible parties (QFS and Admin) based on the response time.

Here's the complaint text: {{{complaintText}}}

Time since last response: {{timeSinceLastResponse}} hours.

Determine if a reminder is needed based on the following criteria:
- If there has been no response in 24 hours, a reminder is needed.
- If the complaint indicates extreme urgency or mentions critical issues, a reminder may be needed even before 24 hours.

Output a JSON object indicating whether a reminder is needed and the reason. Example: {\"needsReminder\": true, \"reason\": \"No response received within 24 hours.\"} or {\"needsReminder\": false, \"reason\": \"Response received recently.\"}

If timeSinceLastResponse is null, assume it's a new complaint that requires analysis.
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const analyzeComplaintResponseTimeFlow = ai.defineFlow(
  {
    name: 'analyzeComplaintResponseTimeFlow',
    inputSchema: AnalyzeComplaintInputSchema,
    outputSchema: AnalyzeComplaintOutputSchema,
  },
  async input => {
    const {output} = await analyzeComplaintResponseTimePrompt(input);
    return output!;
  }
);
