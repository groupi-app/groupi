import { forwardBugReport } from '@/lib/bug-report-ingress';

export const runtime = 'nodejs';
export const maxDuration = 90;
export const POST = (request: Request) => forwardBugReport(request, 'submit');
