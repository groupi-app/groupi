'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { EventInviteSearch } from '@/components/event-invite-search';
import {
  LocalEmailInviteItem,
  EmailInviteItem,
} from '@/components/email-invite-item';
import { useCreateInvite } from '@/hooks/convex/use-invites';
import {
  useEventInvites,
  useCreateEmailInvites,
  useSendEmailInvites,
  useDeleteInvites,
} from '@/hooks/convex/use-invites';
import {
  parseCSV,
  parseBulkEmails,
  generateCSVTemplate,
  deduplicateInvites,
  ParsedInvite,
} from '@/lib/csv-parser';
import { useInviteDialogStore } from '@/stores/invite-dialog-store';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Link2,
  Mail,
  AtSign,
  Upload,
  Download,
  Send,
  Plus,
  Users,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';

type InviteTab = 'link' | 'email' | 'username';

const MAX_MESSAGE_LENGTH = 480;

// Helper function to calculate expiration date
function calculateExpirationDate(expiresInMs: number | null): Date | null {
  return expiresInMs === null ? null : new Date(Date.now() + expiresInMs);
}

/**
 * AnimatedTabsContent - Tabs with smooth height and fade transitions
 */
function AnimatedTabsContent({
  eventId,
  defaultTab,
  setTab,
}: {
  eventId: Id<'events'>;
  defaultTab: InviteTab;
  setTab: (tab: InviteTab) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number | null>(null);
  const [animationState, setAnimationState] = useState<{
    height: number | 'auto';
    animate: boolean;
    opacity: number;
  }>({ height: 'auto', animate: false, opacity: 1 });

  // Handle tab change - measure heights and trigger animation
  const handleTabChange = useCallback(
    (newTab: string) => {
      if (!contentRef.current) {
        setTab(newTab as InviteTab);
        return;
      }

      // Capture current height before tab changes
      previousHeightRef.current = contentRef.current.offsetHeight;

      // Start fade out
      setAnimationState(prev => ({ ...prev, opacity: 0 }));

      // Change the tab after a short fade delay
      setTimeout(() => {
        setTab(newTab as InviteTab);
      }, 100);
    },
    [setTab]
  );

  // Measure new content and animate after tab change
  useEffect(() => {
    if (!contentRef.current || previousHeightRef.current === null) return;

    const currentHeight = previousHeightRef.current;

    // Measure the new content height after render
    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return;

      const activeContent = contentRef.current.querySelector(
        '[data-state="active"]'
      ) as HTMLElement | null;

      if (activeContent) {
        const newHeight = activeContent.scrollHeight;

        // Set to current height first (no animation yet), keep faded out
        setAnimationState({
          height: currentHeight,
          animate: false,
          opacity: 0,
        });

        // Then animate to new height and fade in
        requestAnimationFrame(() => {
          setAnimationState({ height: newHeight, animate: true, opacity: 1 });

          // After animation, reset to auto
          setTimeout(() => {
            setAnimationState({ height: 'auto', animate: false, opacity: 1 });
            previousHeightRef.current = null;
          }, 220);
        });
      }
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [defaultTab]);

  return (
    <Tabs
      value={defaultTab}
      onValueChange={handleTabChange}
      className='flex-1 flex flex-col min-h-0'
    >
      <TabsList className='grid w-full grid-cols-3'>
        <TabsTrigger value='link' className='flex items-center gap-1.5'>
          <Link2 className='size-4' />
          <span className='hidden sm:inline'>Link</span>
        </TabsTrigger>
        <TabsTrigger value='email' className='flex items-center gap-1.5'>
          <Mail className='size-4' />
          <span className='hidden sm:inline'>Email</span>
        </TabsTrigger>
        <TabsTrigger value='username' className='flex items-center gap-1.5'>
          <AtSign className='size-4' />
          <span className='hidden sm:inline'>Username</span>
        </TabsTrigger>
      </TabsList>

      <div
        ref={contentRef}
        className='relative mt-4 overflow-hidden'
        style={{
          height:
            animationState.height === 'auto'
              ? 'auto'
              : `${animationState.height}px`,
          opacity: animationState.opacity,
          transition: animationState.animate
            ? 'height 200ms ease-out, opacity 150ms ease-out'
            : 'opacity 100ms ease-out',
        }}
      >
        <TabsContent value='link' className='mt-0 data-[state=inactive]:hidden'>
          <LinkInviteTab eventId={eventId} />
        </TabsContent>

        <TabsContent
          value='email'
          className='mt-0 data-[state=inactive]:hidden'
        >
          <EmailInviteTab eventId={eventId} />
        </TabsContent>

        <TabsContent
          value='username'
          className='mt-0 data-[state=inactive]:hidden'
        >
          <EventInviteSearch eventId={eventId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

/**
 * UnifiedInviteDialog - A comprehensive invite dialog with three methods:
 * 1. Link - Create shareable invite links
 * 2. Email - Send email invites (manual or bulk)
 * 3. Username - Invite existing users by username
 */
export function UnifiedInviteDialog() {
  const { open, eventId, defaultTab, setOpen, setTab } = useInviteDialogStore();

  if (!eventId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icons.invite className='size-5' />
            Invite People
          </DialogTitle>
          <DialogDescription>
            Choose how you want to invite people to your event.
          </DialogDescription>
        </DialogHeader>

        <AnimatedTabsContent
          eventId={eventId}
          defaultTab={defaultTab}
          setTab={setTab}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Link Invite Tab - Create shareable invite links
 */
function LinkInviteTab({ eventId }: { eventId: Id<'events'> }) {
  const formSchema = z.object({
    name: z
      .string()
      .max(64, { message: 'Invite name must be less than 65 characters.' }),
    expiresIn: z.number().nullable(),
    maxUses: z
      .number()
      .min(1, { message: 'Max uses must be positive integer' })
      .max(999999, {
        message: 'Max uses must be less than 1,000,000 (if not unlimited)',
      })
      .nullable(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      expiresIn: null,
      maxUses: null,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createInvite = useCreateInvite(eventId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const expiresAt = calculateExpirationDate(values.expiresIn);

    try {
      await createInvite({
        name: values.name,
        eventId,
        expiresAt: expiresAt ?? undefined,
        usesTotal: values.maxUses ?? undefined,
      });
      form.reset();
    } catch (error) {
      const err = error as { _tag?: string };
      if (err._tag === 'UnauthorizedError') {
        toast.error('Permission denied', {
          description:
            'You do not have permission to create invites for this event.',
        });
      } else {
        toast.error('Failed to create invite', {
          description: 'The invite could not be created. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='space-y-4'>
      <div className='bg-muted/30 rounded-card p-4'>
        <h4 className='font-medium mb-2 flex items-center gap-2'>
          <Link2 className='size-4' />
          Create Invite Link
        </h4>
        <p className='text-sm text-muted-foreground'>
          Generate a shareable link that anyone can use to join your event.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4'
        >
          {/* Name */}
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className='text-muted-foreground'>(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder='e.g., Friends, Family, VIP' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expires in */}
          <FormField
            control={form.control}
            name='expiresIn'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expires in</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={value => {
                      field.onChange(value === 'never' ? null : Number(value));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Never' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(30 * 60 * 1000)}>
                        30 minutes
                      </SelectItem>
                      <SelectItem value={String(60 * 60 * 1000)}>
                        1 hour
                      </SelectItem>
                      <SelectItem value={String(6 * 60 * 60 * 1000)}>
                        6 hours
                      </SelectItem>
                      <SelectItem value={String(12 * 60 * 60 * 1000)}>
                        12 hours
                      </SelectItem>
                      <SelectItem value={String(24 * 60 * 60 * 1000)}>
                        1 day
                      </SelectItem>
                      <SelectItem value={String(7 * 24 * 60 * 60 * 1000)}>
                        7 days
                      </SelectItem>
                      <SelectItem value='never'>Never</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Max uses */}
          <FormField
            control={form.control}
            name='maxUses'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Max uses{' '}
                  <span className='text-muted-foreground'>
                    (leave blank for unlimited)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='Unlimited'
                    value={field.value ?? ''}
                    onChange={e => {
                      if (e.target.value === '') {
                        field.onChange(null);
                      } else {
                        field.onChange(Number(e.target.value));
                      }
                    }}
                    min={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={isSubmitting} className='w-full'>
            {isSubmitting ? (
              <>
                <Loader2 className='size-4 mr-2 animate-spin' />
                Creating...
              </>
            ) : (
              <>
                <Plus className='size-4 mr-2' />
                Create Invite Link
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

/**
 * Email Invite Tab - Send email invites
 */
function EmailInviteTab({ eventId }: { eventId: Id<'events'> }) {
  const [emailSubTab, setEmailSubTab] = useState<'manual' | 'bulk'>('manual');
  const [isSending, setIsSending] = useState(false);

  // Local state for pending invites (not yet saved)
  const [localInvites, setLocalInvites] = useState<ParsedInvite[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  // Manual add form state
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPlusOnes, setManualPlusOnes] = useState(0);

  // Bulk add state
  const [bulkText, setBulkText] = useState('');
  const [bulkPlusOnes, setBulkPlusOnes] = useState(0);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const inviteData = useEventInvites(eventId);
  const createEmailInvites = useCreateEmailInvites(eventId);
  const sendEmailInvites = useSendEmailInvites(eventId);
  const deleteInvites = useDeleteInvites(eventId);

  // Define the invite type from the query
  type InviteWithEmail = NonNullable<typeof inviteData>['invites'][number] & {
    email: string;
  };

  type BaseInvite = NonNullable<typeof inviteData>['invites'][number];

  // Get email invites from server data
  const emailInvites = useMemo((): InviteWithEmail[] => {
    if (!inviteData?.invites) return [];
    return inviteData.invites.filter(
      (invite: BaseInvite): invite is InviteWithEmail => invite.hasEmail
    );
  }, [inviteData]);

  const pendingCount = inviteData?.pendingEmailCount || 0;

  // Handle manual add
  const handleManualAdd = useCallback(() => {
    if (!manualEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manualEmail.trim())) return;

    const newInvite: ParsedInvite = {
      email: manualEmail.trim().toLowerCase(),
      recipientName: manualName.trim() || undefined,
      plusOnes: manualPlusOnes > 0 ? manualPlusOnes : undefined,
    };

    if (
      localInvites.some(
        (i: ParsedInvite) =>
          i.email.toLowerCase() === newInvite.email.toLowerCase()
      )
    ) {
      return;
    }

    if (
      emailInvites.some((i: InviteWithEmail) => i.email === newInvite.email)
    ) {
      return;
    }

    setLocalInvites(prev => [...prev, newInvite]);
    setManualEmail('');
    setManualName('');
    setManualPlusOnes(0);
  }, [manualEmail, manualName, manualPlusOnes, localInvites, emailInvites]);

  // Handle bulk add
  const handleBulkAdd = useCallback(() => {
    if (!bulkText.trim()) return;

    const result = parseBulkEmails(bulkText);
    setBulkErrors(result.errors);

    if (result.invites.length > 0) {
      const existingEmails = new Set([
        ...localInvites.map((i: ParsedInvite) => i.email.toLowerCase()),
        ...emailInvites.map((i: InviteWithEmail) => i.email?.toLowerCase()),
      ]);

      const newInvites = result.invites
        .filter((i: ParsedInvite) => !existingEmails.has(i.email.toLowerCase()))
        .map((i: ParsedInvite) => ({
          ...i,
          plusOnes: bulkPlusOnes > 0 ? bulkPlusOnes : i.plusOnes,
        }));

      setLocalInvites(prev => deduplicateInvites([...prev, ...newInvites]));
      setBulkText('');
    }
  }, [bulkText, bulkPlusOnes, localInvites, emailInvites]);

  // Handle CSV file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        const result = parseCSV(content);
        setBulkErrors(result.errors);

        if (result.invites.length > 0) {
          const existingEmails = new Set([
            ...localInvites.map((i: ParsedInvite) => i.email.toLowerCase()),
            ...emailInvites.map((i: InviteWithEmail) => i.email?.toLowerCase()),
          ]);

          const newInvites = result.invites
            .filter(
              (i: ParsedInvite) => !existingEmails.has(i.email.toLowerCase())
            )
            .map((i: ParsedInvite) => ({
              ...i,
              plusOnes:
                i.plusOnes !== undefined
                  ? i.plusOnes
                  : bulkPlusOnes > 0
                    ? bulkPlusOnes
                    : undefined,
            }));

          setLocalInvites(prev => deduplicateInvites([...prev, ...newInvites]));
        }
      };
      reader.readAsText(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [localInvites, emailInvites, bulkPlusOnes]
  );

  // Handle CSV template download
  const handleDownloadTemplate = useCallback(() => {
    const content = generateCSVTemplate();
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invite-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Handle removing a local invite
  const handleRemoveLocal = useCallback((index: number) => {
    setLocalInvites(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle removing a server invite
  const handleRemoveServer = useCallback(
    async (inviteId: Id<'invites'>) => {
      await deleteInvites([inviteId]);
    },
    [deleteInvites]
  );

  // Handle save (create invites on server)
  const handleSave = useCallback(async () => {
    if (localInvites.length === 0) return;

    await createEmailInvites({
      invites: localInvites,
      customMessage: customMessage.trim() || undefined,
    });

    setLocalInvites([]);
  }, [localInvites, customMessage, createEmailInvites]);

  // Handle send emails
  const handleSendEmails = useCallback(async () => {
    setIsSending(true);
    try {
      if (localInvites.length > 0) {
        await handleSave();
      }
      await sendEmailInvites();
    } finally {
      setIsSending(false);
    }
  }, [localInvites.length, handleSave, sendEmailInvites]);

  const totalPending = localInvites.length + pendingCount;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {/* Left Column - Add Invites */}
      <div className='flex flex-col min-h-0'>
        <Tabs
          value={emailSubTab}
          onValueChange={v => setEmailSubTab(v as 'manual' | 'bulk')}
          className='flex-1 flex flex-col min-h-0'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='manual'>
              <Plus className='size-4 mr-1' />
              Manual
            </TabsTrigger>
            <TabsTrigger value='bulk'>
              <Users className='size-4 mr-1' />
              Bulk
            </TabsTrigger>
          </TabsList>

          {/* Manual Add Tab */}
          <TabsContent value='manual' className='flex-1 space-y-3 mt-4'>
            <div>
              <Label htmlFor='manual-name'>Name (optional)</Label>
              <Input
                id='manual-name'
                placeholder='John Doe'
                value={manualName}
                onChange={e => setManualName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='manual-email'>
                Email <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='manual-email'
                type='email'
                placeholder='john@example.com'
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualAdd();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor='manual-plusones'>+1s allowed</Label>
              <Input
                id='manual-plusones'
                type='number'
                min={0}
                max={10}
                value={manualPlusOnes}
                onChange={e => setManualPlusOnes(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button
              onClick={handleManualAdd}
              disabled={!manualEmail.trim()}
              className='w-full'
            >
              <Plus className='size-4 mr-2' />
              Add to list
            </Button>
          </TabsContent>

          {/* Bulk Add Tab */}
          <TabsContent value='bulk' className='flex-1 space-y-3 mt-4'>
            <div>
              <Label htmlFor='bulk-emails'>
                Email addresses (comma, semicolon, or newline separated)
              </Label>
              <Textarea
                id='bulk-emails'
                placeholder={`john@example.com, jane@example.com\nor\nJohn Doe <john@example.com>`}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className='min-h-[80px]'
              />
            </div>
            <div>
              <Label htmlFor='bulk-plusones'>+1s allowed (for all)</Label>
              <Input
                id='bulk-plusones'
                type='number'
                min={0}
                max={10}
                value={bulkPlusOnes}
                onChange={e => setBulkPlusOnes(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button
              onClick={handleBulkAdd}
              disabled={!bulkText.trim()}
              className='w-full'
            >
              <Plus className='size-4 mr-2' />
              Add guests
            </Button>

            <div className='border-t border-border pt-3' />

            {/* CSV Upload */}
            <div className='space-y-2'>
              <Label>Import from CSV</Label>
              <div
                className='border-2 border-dashed border-border rounded-card p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors'
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && fileInputRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInputRef.current.files = dt.files;
                    handleFileUpload({
                      target: fileInputRef.current,
                    } as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.csv'
                  className='hidden'
                  onChange={handleFileUpload}
                />
                <Upload className='size-6 mx-auto mb-1 text-muted-foreground' />
                <p className='text-xs text-muted-foreground'>
                  Drop CSV or click to upload
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleDownloadTemplate}
                className='w-full'
              >
                <Download className='size-4 mr-2' />
                Download template
              </Button>
            </div>

            {/* Bulk errors */}
            {bulkErrors.length > 0 && (
              <div className='p-2 bg-bg-error-subtle rounded-card border border-border-error'>
                <p className='text-xs font-medium text-error mb-1'>
                  Some entries could not be added:
                </p>
                <ul className='text-xs text-error space-y-0.5'>
                  {bulkErrors.slice(0, 3).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {bulkErrors.length > 3 && (
                    <li>...and {bulkErrors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Column - Message & Invitees */}
      <div className='flex flex-col min-h-0 gap-3'>
        {/* Custom Message */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='custom-message'>Message</Label>
            <span
              className={cn(
                'text-xs',
                customMessage.length > MAX_MESSAGE_LENGTH
                  ? 'text-error'
                  : 'text-muted-foreground'
              )}
            >
              {customMessage.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <Textarea
            id='custom-message'
            placeholder='(Optional) Add a personal note...'
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            maxLength={MAX_MESSAGE_LENGTH + 50}
            className='min-h-[50px] resize-none'
          />
        </div>

        {/* Invitees List */}
        <div className='flex-1 min-h-0 flex flex-col'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium flex items-center gap-2'>
              <FileSpreadsheet className='size-4' />
              Invitees
              <Badge variant='secondary'>
                {localInvites.length + emailInvites.length}
              </Badge>
            </h3>
          </div>

          <div className='flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 max-h-[180px]'>
            {/* Local invites (not yet saved) */}
            {localInvites.map((invite: ParsedInvite, index: number) => (
              <LocalEmailInviteItem
                key={`local-${index}`}
                invite={invite}
                onRemove={() => handleRemoveLocal(index)}
              />
            ))}

            {/* Saved invites */}
            {emailInvites.map((invite: InviteWithEmail) => (
              <EmailInviteItem
                key={invite._id}
                invite={{
                  email: invite.email,
                  recipientName: invite.recipientName,
                  plusOnes: (invite.usesTotal || 1) - 1,
                  emailStatus: invite.emailStatus as 'pending' | 'sent' | null,
                }}
                onRemove={() => handleRemoveServer(invite._id as Id<'invites'>)}
              />
            ))}

            {/* Empty state */}
            {localInvites.length === 0 && emailInvites.length === 0 && (
              <div className='text-center py-6 text-muted-foreground'>
                <Mail className='size-8 mx-auto mb-1 opacity-50' />
                <p className='text-xs'>No invites yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with actions */}
        <div className='flex items-center justify-between pt-2 border-t gap-2'>
          {localInvites.length > 0 && (
            <Button variant='outline' size='sm' onClick={handleSave}>
              <Icons.check className='size-4 mr-1' />
              Save ({localInvites.length})
            </Button>
          )}

          <div className='flex-1' />

          <Button
            onClick={handleSendEmails}
            disabled={totalPending === 0 || isSending}
            size='sm'
          >
            {isSending ? (
              <>
                <Loader2 className='size-4 mr-1 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <Send className='size-4 mr-1' />
                Send {totalPending > 0 && `(${totalPending})`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
