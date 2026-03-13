'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { getInviteUrl } from '@/lib/urls';

// ===== API REFERENCES =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let inviteQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let inviteMutations: any;

function initApi() {
  if (!inviteQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    inviteQueries = api.invites?.queries ?? {};
    inviteMutations = api.invites?.mutations ?? {};
  }
}
initApi();

// ===== INVITE QUERIES =====

/**
 * Get event invite management data
 */
export function useEventInvites(eventId: Id<'events'>) {
  return useQuery(inviteQueries.getEventInvites, { eventId });
}

/**
 * Get invite by token (for public invite pages)
 */
export function useInviteByToken(token: string) {
  return useQuery(inviteQueries.getInviteByToken, { token });
}

// ===== INVITE MUTATIONS =====

/**
 * Create a new invite with optimistic updates
 */
export function useCreateInvite(eventId?: Id<'events'>) {
  const baseMutation = useMutation(inviteMutations.createInvite);
  const { toast } = useToast();

  // Create mutation with optimistic update if eventId is provided
  const createInvite = useMemo(() => {
    if (!eventId) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(inviteQueries.getEventInvites, {
        eventId: args.eventId,
      });

      if (currentData === undefined) {
        return;
      }

      // Create optimistic invite
      // eslint-disable-next-line react-hooks/purity -- Date.now() is called in mutation callback, not during render
      const now = Date.now();
      const optimisticInvite = {
        _id: `optimistic_${now}` as unknown as Id<'invites'>,
        _creationTime: now,
        eventId: args.eventId,
        name: args.name,
        token: `pending_${now}`,
        usesTotal: args.usesTotal,
        usesRemaining: args.usesTotal,
        expiresAt: args.expiresAt,
        createdById: `optimistic_membership` as unknown as Id<'memberships'>,
      };

      // Add optimistic invite to the beginning of the list
      localStore.setQuery(
        inviteQueries.getEventInvites,
        { eventId: args.eventId },
        {
          ...currentData,
          invites: [optimisticInvite, ...(currentData.invites || [])],
        }
      );
    });
  }, [baseMutation, eventId]);

  return useCallback(
    async (data: {
      eventId: Id<'events'>;
      name?: string;
      usesTotal?: number;
      expiresAt?: Date;
    }) => {
      try {
        const result = await createInvite({
          eventId: data.eventId,
          name: data.name,
          usesTotal: data.usesTotal,
          expiresAt: data.expiresAt?.getTime(),
        });

        // Copy invite link to clipboard
        const inviteUrl = getInviteUrl(result.invite.token);
        try {
          await navigator.clipboard.writeText(inviteUrl);
          sonnerToast.success('Invite link created and copied to clipboard.');
        } catch {
          sonnerToast.success('Invite link created successfully.');
        }

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create invite. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [createInvite, toast]
  );
}

/**
 * Update an existing invite with optimistic updates
 */
export function useUpdateInvite(eventId?: Id<'events'>) {
  const baseMutation = useMutation(inviteMutations.updateInvite);
  const { toast } = useToast();

  // Create mutation with optimistic update if eventId is provided
  const updateInvite = useMemo(() => {
    if (!eventId) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(inviteQueries.getEventInvites, {
        eventId,
      });

      if (currentData === undefined || !currentData.invites) {
        return;
      }

      // Update the invite in the list
      const updatedInvites = currentData.invites.map(
        (invite: {
          _id: Id<'invites'>;
          name?: string;
          usesTotal?: number;
          usesRemaining?: number;
          expiresAt?: number;
        }) => {
          if (invite._id === args.inviteId) {
            // Calculate new usesRemaining if usesTotal changed
            let newUsesRemaining = invite.usesRemaining;
            if (
              args.usesTotal !== undefined &&
              invite.usesTotal !== undefined &&
              invite.usesRemaining !== undefined
            ) {
              const usesConsumed = invite.usesTotal - invite.usesRemaining;
              newUsesRemaining = Math.max(0, args.usesTotal - usesConsumed);
            } else if (args.usesTotal !== undefined) {
              newUsesRemaining = args.usesTotal;
            }

            return {
              ...invite,
              name: args.name !== undefined ? args.name : invite.name,
              usesTotal:
                args.usesTotal !== undefined
                  ? args.usesTotal
                  : invite.usesTotal,
              usesRemaining: newUsesRemaining,
              expiresAt:
                args.expiresAt !== undefined
                  ? args.expiresAt
                  : invite.expiresAt,
            };
          }
          return invite;
        }
      );

      localStore.setQuery(
        inviteQueries.getEventInvites,
        { eventId },
        {
          ...currentData,
          invites: updatedInvites,
        }
      );
    });
  }, [baseMutation, eventId]);

  return useCallback(
    async (data: {
      inviteId: Id<'invites'>;
      name?: string;
      usesTotal?: number;
      expiresAt?: Date | null;
    }) => {
      try {
        const result = await updateInvite({
          inviteId: data.inviteId,
          name: data.name,
          usesTotal: data.usesTotal,
          expiresAt: data.expiresAt?.getTime() || undefined,
        });

        // No success toast - instant update is feedback enough

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update invite. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [updateInvite, toast]
  );
}

/**
 * Delete invites with optimistic updates
 */
export function useDeleteInvites(eventId?: Id<'events'>) {
  const baseMutation = useMutation(inviteMutations.deleteInvites);
  const { toast } = useToast();

  // Create mutation with optimistic update if eventId is provided
  const deleteInvites = useMemo(() => {
    if (!eventId) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(inviteQueries.getEventInvites, {
        eventId,
      });

      if (currentData === undefined || !currentData.invites) {
        return;
      }

      // Create a set of IDs being deleted for efficient lookup
      const deletingIds = new Set(
        args.inviteIds.map((id: Id<'invites'>) => id)
      );

      // Filter out the deleted invites
      const filteredInvites = currentData.invites.filter(
        (invite: { _id: Id<'invites'> }) => !deletingIds.has(invite._id)
      );

      localStore.setQuery(
        inviteQueries.getEventInvites,
        { eventId },
        {
          ...currentData,
          invites: filteredInvites,
        }
      );
    });
  }, [baseMutation, eventId]);

  return useCallback(
    async (inviteIds: Id<'invites'>[]) => {
      try {
        const result = await deleteInvites({ inviteIds });

        // No success toast - instant removal is feedback enough

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete invites. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [deleteInvites, toast]
  );
}

/**
 * Accept an invite and join the event
 */
export function useAcceptInvite() {
  const acceptInvite = useMutation(inviteMutations.acceptInvite);
  const { toast } = useToast();

  return useCallback(
    async (token: string) => {
      try {
        const result = await acceptInvite({ token });

        toast({
          title: 'Welcome!',
          description: `You've successfully joined ${result.event.title}!`,
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to accept invite. Please check the invite link.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [acceptInvite, toast]
  );
}

// ===== EMAIL INVITE HOOKS =====

/**
 * Create multiple email invites for an event
 */
export function useCreateEmailInvites(eventId: Id<'events'>) {
  const baseMutation = useMutation(inviteMutations.createEmailInvites);
  const { toast } = useToast();

  // Create mutation with optimistic update
  const createEmailInvites = useMemo(() => {
    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(inviteQueries.getEventInvites, {
        eventId: args.eventId,
      });

      if (currentData === undefined) {
        return;
      }

      // Create optimistic invites
      // eslint-disable-next-line react-hooks/purity -- Date.now() is called in mutation callback
      const now = Date.now();
      const optimisticInvites = args.invites.map(
        (
          invite: { email: string; recipientName?: string; plusOnes?: number },
          index: number
        ) => ({
          _id: `optimistic_email_${now}_${index}` as unknown as Id<'invites'>,
          _creationTime: now,
          eventId: args.eventId,
          name: invite.recipientName || invite.email,
          email: invite.email.toLowerCase(),
          recipientName: invite.recipientName,
          customMessage: args.customMessage,
          token: `pending_email_${now}_${index}`,
          usesTotal: 1 + (invite.plusOnes || 0),
          usesRemaining: 1 + (invite.plusOnes || 0),
          expiresAt: args.expiresAt,
          createdById: `optimistic_membership` as unknown as Id<'memberships'>,
          hasEmail: true,
          emailStatus: 'pending' as const,
        })
      );

      // Add optimistic invites to the beginning of the list
      localStore.setQuery(
        inviteQueries.getEventInvites,
        { eventId: args.eventId },
        {
          ...currentData,
          invites: [...optimisticInvites, ...(currentData.invites || [])],
          pendingEmailCount:
            (currentData.pendingEmailCount || 0) + optimisticInvites.length,
        }
      );
    });
  }, [baseMutation]);

  return useCallback(
    async (data: {
      invites: Array<{
        email: string;
        recipientName?: string;
        plusOnes?: number;
      }>;
      customMessage?: string;
      expiresAt?: Date;
    }) => {
      try {
        const result = await createEmailInvites({
          eventId,
          invites: data.invites,
          customMessage: data.customMessage,
          expiresAt: data.expiresAt?.getTime(),
        });

        if (result.createdCount > 0) {
          toast({
            title: 'Invites added',
            description: `Added ${result.createdCount} invite${result.createdCount !== 1 ? 's' : ''} to the list`,
          });
        }

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to add invites. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [createEmailInvites, eventId, toast]
  );
}

/**
 * Send pending email invites for an event
 */
export function useSendEmailInvites(eventId: Id<'events'>) {
  const baseMutation = useMutation(inviteMutations.sendPendingEmailInvites);
  const { toast } = useToast();

  // Create mutation with optimistic update
  const sendEmailInvites = useMemo(() => {
    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(inviteQueries.getEventInvites, {
        eventId: args.eventId,
      });

      if (currentData === undefined) {
        return;
      }

      // Update all pending invites to sent status
      // eslint-disable-next-line react-hooks/purity -- Date.now() is called in mutation callback
      const now = Date.now();
      const updatedInvites = currentData.invites.map(
        (invite: { email?: string; emailStatus?: string | null }) => {
          if (invite.email && invite.emailStatus === 'pending') {
            return {
              ...invite,
              emailSentAt: now,
              emailStatus: 'sent' as const,
            };
          }
          return invite;
        }
      );

      localStore.setQuery(
        inviteQueries.getEventInvites,
        { eventId: args.eventId },
        {
          ...currentData,
          invites: updatedInvites,
          pendingEmailCount: 0,
        }
      );
    });
  }, [baseMutation]);

  return useCallback(async () => {
    try {
      const result = await sendEmailInvites({ eventId });

      if (result.sentCount > 0) {
        toast({
          title: 'Emails sent',
          description: `Sent ${result.sentCount} invite email${result.sentCount !== 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: 'No emails to send',
          description: 'All invites have already been sent.',
        });
      }

      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send emails. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [sendEmailInvites, eventId, toast]);
}
