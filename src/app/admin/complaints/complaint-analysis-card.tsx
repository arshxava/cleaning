'use client';

import { useState, useTransition } from 'react';
import {
  AlertTriangle,
  Bot,
  Clock,
  MessageSquare,
  User,
  Building,
} from 'lucide-react';
import type { AnalyzeComplaintOutput } from '@/ai/flows/complaint-response-time-analyzer';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getComplaintAnalysis } from './actions';
import { useToast } from '@/hooks/use-toast';

export type Complaint = {
  id: string;
  user: string;
  building: string;
  date: string;
  text: string;
  status: 'Pending' | 'Resolved';
  provider: string;
  lastResponseHours: number;
};

type AnalysisResult = {
  success: boolean;
  data?: AnalyzeComplaintOutput;
  error?: string;
};

export function ComplaintAnalysisCard({ complaint }: { complaint: Complaint }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await getComplaintAnalysis(formData);
      setAnalysisResult(result);
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <Card
      className={
        complaint.lastResponseHours > 24 ? 'border-destructive' : ''
      }
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">
              Complaint #{complaint.id}
            </CardTitle>
            <CardDescription>
              {new Date(complaint.date).toLocaleString()}
            </CardDescription>
          </div>
          <Badge
            variant={
              complaint.lastResponseHours > 24 ? 'destructive' : 'outline'
            }
            className="flex items-center gap-2"
          >
            <Clock className="h-3 w-3" />
            {complaint.lastResponseHours} hours since last response
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{complaint.user}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span>{complaint.building}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span>Provider: {complaint.provider}</span>
          </div>
        </div>
        <p className="text-muted-foreground bg-slate-100 p-4 rounded-md border">
          {complaint.text}
        </p>

        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2 text-primary">
                <Bot className="h-5 w-5" />
                Analyze with AI
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <form action={handleSubmit} className="space-y-4 pt-2">
                <input
                  type="hidden"
                  name="complaintText"
                  value={complaint.text}
                />
                <div>
                  <Label htmlFor="timeSinceLastResponse">
                    Time Since Last Response (Hours)
                  </Label>
                  <Input
                    id="timeSinceLastResponse"
                    name="timeSinceLastResponse"
                    type="number"
                    defaultValue={complaint.lastResponseHours}
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </form>

              {analysisResult?.success && analysisResult.data && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Analysis Result</h4>
                  <div
                    className={cn(
                      'p-4 rounded-md border text-sm',
                      analysisResult.data.needsReminder
                        ? 'bg-destructive/10 border-destructive'
                        : 'bg-green-500/10 border-green-500'
                    )}
                  >
                    <div className="flex items-start">
                      {analysisResult.data.needsReminder ? (
                        <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 text-destructive" />
                      ) : (
                        <Bot className="h-5 w-5 mr-3 mt-0.5 text-green-600" />
                      )}
                      <div>
                        <p
                          className={cn(
                            'font-bold',
                            analysisResult.data.needsReminder
                              ? 'text-destructive-foreground'
                              : 'text-green-700'
                          )}
                        >
                          {analysisResult.data.needsReminder
                            ? 'Reminder Needed'
                            : 'No Reminder Needed'}
                        </p>
                        <p className="text-muted-foreground">
                          {analysisResult.data.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button>Reply to User</Button>
        <Button variant="outline">Mark as Resolved</Button>
      </CardFooter>
    </Card>
  );
}
