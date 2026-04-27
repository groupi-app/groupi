import { useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

type TargetType = 'USER' | 'EVENT' | 'POST' | 'REPLY';
type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE_SPEECH'
  | 'INAPPROPRIATE_CONTENT'
  | 'IMPERSONATION'
  | 'OTHER';

export function useCreateReport() {
  const mutation = useMutation(api.reports.mutations.createReport);

  return useCallback(
    async (params: {
      targetType: TargetType;
      targetId: string;
      reason: ReportReason;
      details?: string;
    }) => {
      try {
        await mutation(params);
        toast.success('Report submitted. Thank you for keeping Groupi safe.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to submit report';
        if (message.includes('already reported')) {
          toast.info('You have already reported this');
        } else {
          toast.error(message);
        }
      }
    },
    [mutation]
  );
}
