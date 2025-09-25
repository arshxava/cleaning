
// 'use client';

// import { useState, useTransition } from 'react';
// import {
//   AlertTriangle,
//   Bot,
//   Clock,
//   MessageSquare,
//   User,
//   Building,
//   Loader2,
//   Send,
//   AlertCircle
// } from 'lucide-react';
// import type { AnalyzeComplaintOutput } from '@/ai/flows/complaint-response-time-analyzer';
// import { cn } from '@/lib/utils';
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { markComplaintAsResolved } from './actions';
// import { useToast } from '@/hooks/use-toast';
// import type { Complaint } from '@/lib/types';
// import Image from 'next/image';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { Textarea } from '@/components/ui/textarea';

// type ComplaintCardProps = Complaint & {
//     lastResponseHours: number;
//     onUpdate?: () => void;
// }

// type AnalysisResult = {
//   success: boolean;
//   data?: AnalyzeComplaintOutput;
//   error?: string;
// };

// export function ComplaintAnalysisCard({ complaint, onUpdate }: { complaint: ComplaintCardProps }) {
//   const [isResolving, setIsResolving] = useState(false);
//   const [isReplying, setIsReplying] = useState(false);
//   const [replyText, setReplyText] = useState('');
//   const { toast } = useToast();

//   const handleMarkResolved = async () => {
//     setIsResolving(true);
//     const result = await markComplaintAsResolved(complaint._id);
//     if (result.success) {
//       toast({ title: 'Success', description: 'Complaint marked as resolved.' });
//       onUpdate?.();
//     } else {
//       toast({ variant: 'destructive', title: 'Error', description: result.error });
//     }
//     setIsResolving(false);
//   };
  
//   const handleSendReply = async () => {
//     if (replyText.trim().length < 10) {
//         toast({ variant: 'destructive', title: 'Reply is too short.'});
//         return;
//     }
//     setIsReplying(true);
//     try {
//         const response = await fetch('/api/admin-complaint-responses', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 complaintId: complaint._id,
//                 responseText: replyText,
//                 adminName: 'Admin Team', // This could come from a profile
//                 userId: complaint.userId,
//             })
//         });

//         if (!response.ok) throw new Error('Failed to send reply.');

//         toast({ title: "Reply Sent", description: "Your reply has been emailed to the user and the complaint is resolved."});
//         onUpdate?.();
//     } catch (error) {
//          toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
//     } finally {
//         setIsReplying(false);
//         setReplyText('');
//     }
//   }


//   return (
//     <Card
//       className={cn(
//         complaint.lastResponseHours > 24 ? 'border-destructive' : ''
//       )}
//     >
//       <CardHeader>
//         <div className="flex justify-between items-start">
//           <div>
//             <CardTitle className="font-headline text-xl">
//               Complaint #{complaint._id.slice(-6)}
//             </CardTitle>
//             <CardDescription>
//               {new Date(complaint.date).toLocaleString()}
//             </CardDescription>
//           </div>
//           <Badge
//             variant={
//               complaint.lastResponseHours > 24 ? 'destructive' : 'outline'
//             }
//             className="flex items-center gap-2"
//           >
//             <Clock className="h-3 w-3" />
//             {complaint.lastResponseHours} hours since last response
//           </Badge>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
//           <div className="flex items-center gap-2">
//             <User className="w-4 h-4 text-muted-foreground" />
//             <span>{complaint.user}</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Building className="w-4 h-4 text-muted-foreground" />
//             <span>{complaint.building}</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <MessageSquare className="w-4 h-4 text-muted-foreground" />
//             <span>Provider: {complaint.provider}</span>
//           </div>
//            <div className="flex items-center gap-2">
//             <AlertCircle className="w-4 h-4 text-muted-foreground" />
//             <span>Type: <span className="font-medium">{complaint.complaintType === 'damage' ? 'Breakage/Damage' : 'Service Quality'}</span></span>
//           </div>
//         </div>
//         <p className="text-muted-foreground bg-slate-100 p-4 rounded-md border">
//           {complaint.complaint}
//         </p>

//          {complaint.imageUrl && (
//           <div className="mt-4">
//             <Image
//               src={complaint.imageUrl}
//               alt="Complaint image"
//               width={200}
//               height={200}
//               className="rounded-md object-cover"
//               data-ai-hint="complaint photo"
//             />
//           </div>
//         )}
//       </CardContent>
//       <CardFooter className="flex gap-2">
//         <Dialog>
//             <DialogTrigger asChild>
//                 <Button>Reply to User</Button>
//             </DialogTrigger>
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>Reply to {complaint.user}</DialogTitle>
//                     <DialogDescription>
//                         Your response will be emailed to the user and this complaint will be marked as resolved.
//                     </DialogDescription>
//                 </DialogHeader>
//                 <div className="py-4">
//                     <Textarea 
//                         value={replyText}
//                         onChange={(e) => setReplyText(e.target.value)}
//                         placeholder="Write your response..."
//                         rows={5}
//                     />
//                 </div>
//                 <DialogFooter>
//                     <Button onClick={handleSendReply} disabled={isReplying}>
//                         {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
//                         {isReplying ? 'Sending...' : 'Send Reply'}
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//         <Button variant="outline" onClick={handleMarkResolved} disabled={isResolving}>
//             {isResolving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
//             Mark Resolved (No Reply)
//         </Button>
//       </CardFooter>
//     </Card>
//   );
// }


'use client';

import { useState } from 'react';
import {
  Clock,
  MessageSquare,
  User,
  Building,
  Loader2,
  Send,
  AlertCircle
} from 'lucide-react';
import type { AnalyzeComplaintOutput } from '@/ai/flows/complaint-response-time-analyzer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { markComplaintAsResolved } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { Complaint } from '@/lib/types';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type ComplaintCardProps = Complaint & {
  lastResponseHours: number;
};

type ComplaintAnalysisCardProps = {
  complaint: ComplaintCardProps;
  onUpdate?: () => void;
};

export function ComplaintAnalysisCard({ complaint, onUpdate }: ComplaintAnalysisCardProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { toast } = useToast();

  const handleMarkResolved = async () => {
    setIsResolving(true);
    const result = await markComplaintAsResolved(complaint._id);
    if (result.success) {
      toast({ title: 'Success', description: 'Complaint marked as resolved.' });
      onUpdate?.();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsResolving(false);
  };

  const handleSendReply = async () => {
    if (replyText.trim().length < 10) {
      toast({ variant: 'destructive', title: 'Reply is too short.' });
      return;
    }
    setIsReplying(true);
    try {
      const response = await fetch('/api/admin-complaint-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: complaint._id,
          responseText: replyText,
          adminName: 'Admin Team',
          userId: complaint.userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send reply.');

      toast({ title: 'Reply Sent', description: 'Your reply has been emailed to the user and the complaint is resolved.' });
      onUpdate?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsReplying(false);
      setReplyText('');
    }
  };

  return (
    <Card className={cn(complaint.lastResponseHours > 24 ? 'border-destructive' : '')}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">
              Complaint #{complaint._id.slice(-6)}
            </CardTitle>
            <CardDescription>
              {new Date(complaint.date).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant={complaint.lastResponseHours > 24 ? 'destructive' : 'outline'} className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {complaint.lastResponseHours} hours since last response
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
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
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span>
              Type: <span className="font-medium">{complaint.complaintType === 'damage' ? 'Breakage/Damage' : 'Service Quality'}</span>
            </span>
          </div>
        </div>

        <p className="text-muted-foreground bg-slate-100 p-4 rounded-md border">{complaint.complaint}</p>

        {complaint.imageUrl && (
          <div className="mt-4">
            <Image
              src={complaint.imageUrl}
              alt="Complaint image"
              width={200}
              height={200}
              className="rounded-md object-cover"
              data-ai-hint="complaint photo"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Reply to User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to {complaint.user}</DialogTitle>
              <DialogDescription>
                Your response will be emailed to the user and this complaint will be marked as resolved.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response..."
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleSendReply} disabled={isReplying}>
                {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                {isReplying ? 'Sending...' : 'Send Reply'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleMarkResolved} disabled={isResolving}>
          {isResolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Mark Resolved (No Reply)
        </Button>
      </CardFooter>
    </Card>
  );
}
