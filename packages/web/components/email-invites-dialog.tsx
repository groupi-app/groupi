'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  LocalEmailInviteItem,
  EmailInviteItem,
} from '@/components/email-invite-item';
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
import { Id } from '@/convex/_generated/dataModel';
import {
  Mail,
  Upload,
  Download,
  Send,
  Plus,
  Users,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';

const MAX_MESSAGE_LENGTH = 480;

interface EmailInvitesDialogProps {
  eventId: Id<'events'>;
  trigger?: React.ReactNode;
}

type TabValue = 'manual' | 'bulk';

export function EmailInvitesDialog({
  eventId,
  trigger,
}: EmailInvitesDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('manual');
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

  // Get the base invite type
  type BaseInvite = NonNullable<typeof inviteData>['invites'][number];

  // Get email invites from server data
  const emailInvites = useMemo((): InviteWithEmail[] => {
    if (!inviteData?.invites) return [];
    return inviteData.invites.filter(
      (invite: BaseInvite): invite is InviteWithEmail => invite.hasEmail
    );
  }, [inviteData]);

  // Handle manual add
  const handleManualAdd = useCallback(() => {
    if (!manualEmail.trim()) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manualEmail.trim())) {
      return;
    }

    const newInvite: ParsedInvite = {
      email: manualEmail.trim().toLowerCase(),
      recipientName: manualName.trim() || undefined,
      plusOnes: manualPlusOnes > 0 ? manualPlusOnes : undefined,
    };

    // Check if already in local list
    if (
      localInvites.some(
        (i: ParsedInvite) =>
          i.email.toLowerCase() === newInvite.email.toLowerCase()
      )
    ) {
      return;
    }

    // Check if already in server list
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
      // Filter out duplicates
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
          // Filter out duplicates
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
              // Use CSV plusOnes if present, otherwise apply bulkPlusOnes
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

      // Reset file input
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

  // Handle send invites (create + send in one action)
  const handleSendInvites = useCallback(async () => {
    setIsSending(true);
    try {
      if (localInvites.length > 0) {
        await createEmailInvites({
          invites: localInvites,
          customMessage: customMessage.trim() || undefined,
        });
        setLocalInvites([]);
      }
      await sendEmailInvites();
    } finally {
      setIsSending(false);
    }
  }, [localInvites, customMessage, createEmailInvites, sendEmailInvites]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='outline' size='sm'>
            <Mail className='size-4 mr-2' />
            Email Invites
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Mail className='size-5' />
            Email Invites
          </DialogTitle>
          <DialogDescription className='sr-only'>
            Invite guests via email. Add emails manually, in bulk, or import
            from CSV.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Left Column - Add Invites */}
          <div className='flex flex-col min-h-0'>
            <Tabs
              value={activeTab}
              onValueChange={v => setActiveTab(v as TabValue)}
              className='flex-1 flex flex-col min-h-0'
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='manual'>
                  <Plus className='size-4 mr-1' />
                  Add Manually
                </TabsTrigger>
                <TabsTrigger value='bulk'>
                  <Users className='size-4 mr-1' />
                  Bulk Add
                </TabsTrigger>
              </TabsList>

              {/* Manual Add Tab */}
              <TabsContent
                value='manual'
                className='flex-1 space-y-4 overflow-y-auto mt-4'
              >
                <div className='space-y-3'>
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
                      onChange={e =>
                        setManualPlusOnes(parseInt(e.target.value) || 0)
                      }
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
                </div>
              </TabsContent>

              {/* Bulk Add Tab */}
              <TabsContent
                value='bulk'
                className='flex-1 space-y-4 overflow-y-auto mt-4'
              >
                <div className='space-y-3'>
                  <div>
                    <Label htmlFor='bulk-emails'>
                      Email addresses (comma, semicolon, or newline separated)
                    </Label>
                    <Textarea
                      id='bulk-emails'
                      placeholder={`john@example.com, jane@example.com
or
John Doe <john@example.com>; Jane Smith <jane@example.com>`}
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      className='min-h-[100px]'
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
                      onChange={e =>
                        setBulkPlusOnes(parseInt(e.target.value) || 0)
                      }
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
                </div>

                <div className='border-t border-border' />

                {/* CSV Upload */}
                <div className='space-y-3'>
                  <Label>Import from CSV</Label>
                  <div
                    className='border-2 border-dashed border-border rounded-card p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors'
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
                    <Upload className='size-8 mx-auto mb-2 text-muted-foreground' />
                    <p className='text-sm text-muted-foreground'>
                      Drop CSV file or click to upload
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Columns: email, name (optional), plusOnes (optional)
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
                  <div className='p-3 bg-bg-error-subtle rounded-card border border-border-error'>
                    <p className='text-sm font-medium text-error mb-1'>
                      Some entries could not be added:
                    </p>
                    <ul className='text-xs text-error space-y-0.5'>
                      {bulkErrors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {bulkErrors.length > 5 && (
                        <li>...and {bulkErrors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Message & Invitees */}
          <div className='flex flex-col min-h-0 gap-4'>
            {/* Custom Message */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='custom-message'>Message</Label>
                <span
                  className={`text-xs ${customMessage.length > MAX_MESSAGE_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {customMessage.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
              <div className='text-xs text-muted-foreground space-y-1 p-2 bg-muted/30 rounded-input'>
                <p>
                  Hey <span className='font-medium'>[Name]</span>, you&apos;re
                  invited to <span className='font-medium'>[Event Title]</span>!
                </p>
              </div>
              <Textarea
                id='custom-message'
                placeholder='(Optional) Add a personal note...'
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                maxLength={MAX_MESSAGE_LENGTH + 50} // Allow some buffer
                className='min-h-[60px] resize-none'
              />
              <div className='text-xs text-muted-foreground p-2 bg-muted/30 rounded-input'>
                <p>
                  Can you make it?{' '}
                  <span className='text-primary underline'>RSVP here</span>
                </p>
              </div>
            </div>

            <div className='border-t border-border' />

            {/* Invitees List */}
            <div className='flex-1 min-h-0 flex flex-col'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='font-medium flex items-center gap-2'>
                  <FileSpreadsheet className='size-4' />
                  Invitees
                  <Badge variant='secondary'>
                    {localInvites.length + emailInvites.length}
                  </Badge>
                </h3>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto space-y-2 pr-1'>
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
                      emailStatus: invite.emailStatus as
                        | 'pending'
                        | 'sent'
                        | null,
                    }}
                    onRemove={() =>
                      handleRemoveServer(invite._id as Id<'invites'>)
                    }
                  />
                ))}

                {/* Empty state */}
                {localInvites.length === 0 && emailInvites.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    <Mail className='size-10 mx-auto mb-2 opacity-50' />
                    <p className='text-sm'>No invites yet</p>
                    <p className='text-xs'>
                      Add emails using the form on the left
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with actions */}
        <div className='flex items-center justify-end pt-4 border-t gap-4'>
          <Button
            onClick={handleSendInvites}
            disabled={localInvites.length === 0 || isSending}
            className='min-w-[150px]'
          >
            {isSending ? (
              <>
                <Loader2 className='size-4 mr-2 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <Send className='size-4 mr-2' />
                Send invites
                {localInvites.length > 0 && ` (${localInvites.length})`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
