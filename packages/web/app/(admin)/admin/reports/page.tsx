'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('@/convex/_generated/api') as { api: any };

type StatusFilter = 'ALL' | 'PENDING' | 'DISMISSED' | 'ACTION_TAKEN';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ACTION_TAKEN', label: 'Action Taken' },
];

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  HATE_SPEECH: 'Hate Speech',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  IMPERSONATION: 'Impersonation',
  OTHER: 'Other',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  USER: 'User',
  EVENT: 'Event',
  POST: 'Post',
  REPLY: 'Reply',
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') {
    return (
      <Badge variant='outline' className='bg-bg-warning-subtle text-warning'>
        Pending
      </Badge>
    );
  }
  if (status === 'DISMISSED') {
    return (
      <Badge variant='outline' className='text-muted-foreground'>
        Dismissed
      </Badge>
    );
  }
  return (
    <Badge variant='outline' className='bg-bg-success-subtle text-success'>
      Action Taken
    </Badge>
  );
}

function TargetTypeBadge({ type }: { type: string }) {
  return <Badge variant='secondary'>{TARGET_TYPE_LABELS[type] || type}</Badge>;
}

/**
 * Build an explorer deep-link URL for a report target.
 * The explorer supports user/event/post detail views.
 * For replies, link to the parent post via contextPostId.
 * For users reported by personId, link to the user detail.
 */
function getExplorerUrl(report: {
  targetType: string;
  targetId: string;
  contextPostId?: string;
  reporterId?: string;
}): string | null {
  switch (report.targetType) {
    case 'USER':
      return `/admin/explorer?type=user&id=${report.targetId}`;
    case 'EVENT':
      return `/admin/explorer?type=event&id=${report.targetId}`;
    case 'POST':
      return `/admin/explorer?type=post&id=${report.targetId}`;
    case 'REPLY':
      // Explorer doesn't have a reply detail view; link to parent post
      if (report.contextPostId) {
        return `/admin/explorer?type=post&id=${report.contextPostId}`;
      }
      return null;
    default:
      return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Report = any;

export default function AdminReportsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [actionReport, setActionReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<
    'dismiss' | 'resolve' | 'delete_content' | null
  >(null);
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const reportsData = useQuery(api.reports.queries.getReportsAdmin, {
    search: debouncedSearch || undefined,
    statusFilter,
    limit: 50,
  });

  const reportStats = useQuery(api.reports.queries.getReportStats, {});

  const dismissReport = useMutation(api.reports.adminMutations.dismissReport);
  const resolveReport = useMutation(api.reports.adminMutations.resolveReport);

  // Admin mutations for deleting content
  const deletePost = useMutation(api.admin.mutations.deletePost);
  const deleteReply = useMutation(api.admin.mutations.deleteReply);

  const handleDismiss = async (report: Report) => {
    setIsLoading(true);
    try {
      await dismissReport({
        reportId: report._id as Id<'reports'>,
        ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
      });
      toast.success('Report dismissed');
      setActionReport(null);
      setActionType(null);
      setAdminNote('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to dismiss report'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (report: Report) => {
    setIsLoading(true);
    try {
      await resolveReport({
        reportId: report._id as Id<'reports'>,
        ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
      });
      toast.success('Report resolved');
      setActionReport(null);
      setActionType(null);
      setAdminNote('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resolve report'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContent = async (report: Report) => {
    setIsLoading(true);
    try {
      if (report.targetType === 'POST') {
        await deletePost({
          postId: report.targetId as Id<'posts'>,
        });
      } else if (report.targetType === 'REPLY') {
        await deleteReply({
          replyId: report.targetId as Id<'replies'>,
        });
      }
      // Resolve the report after deleting content
      await resolveReport({
        reportId: report._id as Id<'reports'>,
        adminNote: adminNote.trim()
          ? adminNote.trim()
          : 'Content deleted by admin',
      });
      toast.success('Content deleted and report resolved');
      setActionReport(null);
      setActionType(null);
      setAdminNote('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete content'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (!actionReport || !actionType) return;
    if (actionType === 'dismiss') handleDismiss(actionReport);
    else if (actionType === 'resolve') handleResolve(actionReport);
    else if (actionType === 'delete_content') handleDeleteContent(actionReport);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Reports</h1>
        <p className='text-muted-foreground'>
          Review and manage content reports from users
        </p>
      </div>

      {/* Stats */}
      {reportStats && (
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardContent className='pt-4'>
              <div className='text-2xl font-bold'>{reportStats.total}</div>
              <p className='text-xs text-muted-foreground'>Total Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4'>
              <div className='text-2xl font-bold text-warning'>
                {reportStats.pending}
              </div>
              <p className='text-xs text-muted-foreground'>Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4'>
              <div className='text-2xl font-bold text-muted-foreground'>
                {reportStats.dismissed}
              </div>
              <p className='text-xs text-muted-foreground'>Dismissed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4'>
              <div className='text-2xl font-bold text-success'>
                {reportStats.actionTaken}
              </div>
              <p className='text-xs text-muted-foreground'>Action Taken</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Input
          placeholder='Search reports...'
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className='max-w-xs'
        />
        <div className='flex gap-1'>
          {STATUS_TABS.map(tab => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'outline'}
              size='sm'
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === 'ALL'
              ? 'All'
              : statusFilter === 'PENDING'
                ? 'Pending'
                : statusFilter === 'DISMISSED'
                  ? 'Dismissed'
                  : 'Resolved'}{' '}
            Reports
          </CardTitle>
          <CardDescription>
            {reportsData?.totalCount ?? 0} report
            {(reportsData?.totalCount ?? 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!reportsData ? (
            <div className='flex justify-center py-8'>
              <Icons.spinner className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : reportsData.reports.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No reports found
            </div>
          ) : (
            <div className='space-y-4'>
              {reportsData.reports.map((report: Report) => (
                <div
                  key={report._id}
                  className='rounded-card border p-4 space-y-3'
                >
                  {/* Header row */}
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <TargetTypeBadge type={report.targetType} />
                      <StatusBadge status={report.status} />
                      <Badge variant='outline'>
                        {REASON_LABELS[report.reason] || report.reason}
                      </Badge>
                    </div>
                    {report.status === 'PENDING' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <Icons.more className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => {
                              setActionReport(report);
                              setActionType('dismiss');
                              setAdminNote('');
                            }}
                          >
                            <Icons.close className='size-4 mr-2' />
                            Dismiss
                          </DropdownMenuItem>
                          {(report.targetType === 'POST' ||
                            report.targetType === 'REPLY') && (
                            <DropdownMenuItem
                              onClick={() => {
                                setActionReport(report);
                                setActionType('delete_content');
                                setAdminNote('');
                              }}
                              className='focus:bg-destructive focus:text-destructive-foreground'
                            >
                              <Icons.delete className='size-4 mr-2' />
                              Delete Content
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setActionReport(report);
                              setActionType('resolve');
                              setAdminNote('');
                            }}
                          >
                            <Icons.check className='size-4 mr-2' />
                            Mark Resolved
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Target preview */}
                  <div className='space-y-1'>
                    <p className='font-medium'>
                      {report.targetPreview?.label || 'Unknown'}
                    </p>
                    {report.targetPreview?.content && (
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {report.targetPreview.content}
                      </p>
                    )}
                    {report.targetPreview?.authorName && (
                      <p className='text-xs text-muted-foreground'>
                        by {report.targetPreview.authorName}
                      </p>
                    )}
                    {report.targetPreview?.eventTitle && (
                      <p className='text-xs text-muted-foreground'>
                        in {report.targetPreview.eventTitle}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  {report.details && (
                    <div className='bg-muted/50 rounded-md p-3'>
                      <p className='text-sm text-muted-foreground'>
                        &ldquo;{report.details}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Meta info */}
                  <div className='flex items-center gap-4 text-xs text-muted-foreground flex-wrap'>
                    <span>
                      Reported by{' '}
                      {report.reporter?.name ||
                        report.reporter?.email ||
                        'Unknown'}
                    </span>
                    <span>{formatDate(report.createdAt)}</span>
                    {report.resolver && (
                      <span>
                        Resolved by{' '}
                        {report.resolver.name || report.resolver.email}
                      </span>
                    )}
                    {getExplorerUrl(report) && (
                      <Link
                        href={getExplorerUrl(report)!}
                        className='inline-flex items-center gap-1 text-primary hover:underline'
                      >
                        <Icons.search className='size-3' />
                        View in Explorer
                      </Link>
                    )}
                  </div>

                  {/* Admin note */}
                  {report.adminNote && (
                    <div className='text-xs text-muted-foreground border-t pt-2'>
                      <span className='font-medium'>Admin note:</span>{' '}
                      {report.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={!!actionType}
        onOpenChange={open => {
          if (!open) {
            setActionType(null);
            setActionReport(null);
            setAdminNote('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'dismiss'
                ? 'Dismiss Report'
                : actionType === 'delete_content'
                  ? 'Delete Content'
                  : 'Mark as Resolved'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'dismiss'
                ? 'This report will be marked as dismissed with no action taken.'
                : actionType === 'delete_content'
                  ? 'The reported content will be permanently deleted and the report marked as resolved.'
                  : 'This report will be marked as resolved with action taken.'}
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium'>
              Admin note{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </label>
            <Textarea
              placeholder='Add a note about this action...'
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => {
                setActionType(null);
                setActionReport(null);
                setAdminNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                actionType === 'delete_content' ? 'destructive' : 'default'
              }
              onClick={handleConfirmAction}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className='size-4 mr-2 animate-spin' />
              )}
              {actionType === 'dismiss'
                ? 'Dismiss'
                : actionType === 'delete_content'
                  ? 'Delete Content'
                  : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
