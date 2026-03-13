'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { toast } from 'sonner';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let reportApi: { mutations: any; queries: any };
function initApi() {
  if (!reportApi) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    reportApi = {
      mutations: api.reports?.mutations ?? {},
      queries: api.reports?.queries ?? {},
    };
  }
}
initApi();

type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE_SPEECH'
  | 'INAPPROPRIATE_CONTENT'
  | 'IMPERSONATION'
  | 'OTHER';

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  HATE_SPEECH: 'Hate Speech',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  IMPERSONATION: 'Impersonation',
  OTHER: 'Other',
};

interface ReportDialogProps {
  targetType: 'USER' | 'EVENT' | 'POST' | 'REPLY';
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}

export function ReportDialog({
  targetType,
  targetId,
  targetLabel,
  onClose,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const alreadyReported = useQuery(reportApi.queries.hasReported, {
    targetType,
    targetId,
  });
  const createReport = useMutation(reportApi.mutations.createReport);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        ...(details.trim() ? { details: details.trim() } : {}),
      });
      toast.success(
        'Report submitted. Thank you for helping keep Groupi safe.'
      );
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit report';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadyReported) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Already Reported</DialogTitle>
          <DialogDescription>
            You have already reported this {targetType.toLowerCase()}. Our team
            will review it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Report {targetType.charAt(0) + targetType.slice(1).toLowerCase()}
        </DialogTitle>
        <DialogDescription>
          Report &ldquo;{targetLabel}&rdquo; for violating our community
          guidelines.
        </DialogDescription>
      </DialogHeader>

      <div className='flex flex-col gap-4 py-2'>
        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium'>Reason</label>
          <Select
            value={reason}
            onValueChange={v => setReason(v as ReportReason)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select a reason...' />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(REASON_LABELS) as ReportReason[]).map(key => (
                <SelectItem key={key} value={key}>
                  {REASON_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium'>
            Additional details{' '}
            <span className='text-muted-foreground font-normal'>
              (optional)
            </span>
          </label>
          <Textarea
            placeholder='Provide any additional context...'
            value={details}
            onChange={e => setDetails(e.target.value.slice(0, 1000))}
            rows={3}
          />
          <span className='text-xs text-muted-foreground text-right'>
            {details.length}/1000
          </span>
        </div>
      </div>

      <DialogFooter>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting && (
              <Icons.spinner className='size-4 mr-2 animate-spin' />
            )}
            Submit Report
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
