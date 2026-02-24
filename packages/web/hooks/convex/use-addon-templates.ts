'use client';

import { useQuery, useMutation } from 'convex/react';
import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Id } from '@/convex/_generated/dataModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let templateQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let templateMutations: any;

function initApi() {
  if (!templateQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    templateQueries = api.addonTemplates?.queries ?? {};
    templateMutations = api.addonTemplates?.mutations ?? {};
  }
}
initApi();

// ===== QUERIES =====

export function useMyTemplates() {
  return useQuery(templateQueries.getMyTemplates, {});
}

export function useTemplate(templateId: Id<'addonTemplates'> | undefined) {
  return useQuery(
    templateQueries.getTemplate,
    templateId ? { templateId } : 'skip'
  );
}

export function useMyPublishedTemplates() {
  return useQuery(templateQueries.getMyPublishedTemplates, {});
}

// ===== MUTATIONS =====

export function useCreateTemplate() {
  const mutation = useMutation(templateMutations.createTemplate);
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const createTemplate = useCallback(
    async (args: {
      name: string;
      description: string;
      iconName: string;
      template: unknown;
    }) => {
      setIsPending(true);
      try {
        const result = await mutation(args);
        toast({
          title: 'Add-on created',
          description: 'Your add-on has been saved as a draft.',
        });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create add-on';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [mutation, toast]
  );

  return { createTemplate, isPending };
}

export function useUpdateTemplate() {
  const mutation = useMutation(templateMutations.updateTemplate);
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const updateTemplate = useCallback(
    async (args: {
      templateId: Id<'addonTemplates'>;
      name?: string;
      description?: string;
      iconName?: string;
      template?: unknown;
    }) => {
      setIsPending(true);
      try {
        await mutation(args);
        toast({
          title: 'Add-on saved',
          description: 'Your changes have been saved.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save add-on';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [mutation, toast]
  );

  return { updateTemplate, isPending };
}

export function usePublishTemplate() {
  const mutation = useMutation(templateMutations.publishTemplate);
  const { toast } = useToast();

  return useCallback(
    async (templateId: Id<'addonTemplates'>) => {
      try {
        await mutation({ templateId });
        toast({
          title: 'Add-on published',
          description: 'Your add-on is now ready to use on events.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to publish';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [mutation, toast]
  );
}

export function useUnpublishTemplate() {
  const mutation = useMutation(templateMutations.unpublishTemplate);
  const { toast } = useToast();

  return useCallback(
    async (templateId: Id<'addonTemplates'>) => {
      try {
        await mutation({ templateId });
        toast({
          title: 'Add-on unpublished',
          description: 'Your add-on is now a draft.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to unpublish';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [mutation, toast]
  );
}

export function useDeleteTemplate() {
  const mutation = useMutation(templateMutations.deleteTemplate);
  const { toast } = useToast();

  return useCallback(
    async (templateId: Id<'addonTemplates'>) => {
      try {
        await mutation({ templateId });
        toast({
          title: 'Add-on deleted',
          description: 'Your add-on has been permanently removed.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [mutation, toast]
  );
}

export function useDuplicateTemplate() {
  const mutation = useMutation(templateMutations.duplicateTemplate);
  const { toast } = useToast();

  return useCallback(
    async (templateId: Id<'addonTemplates'>) => {
      try {
        const newId = await mutation({ templateId });
        toast({
          title: 'Add-on duplicated',
          description: 'A copy has been created as a draft.',
        });
        return newId;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to duplicate';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [mutation, toast]
  );
}
