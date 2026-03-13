'use client';

import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useMyTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
  usePublishTemplate,
  useUnpublishTemplate,
} from '@/hooks/convex/use-addon-templates';
import type { Id } from '@/convex/_generated/dataModel';

function TemplateCard({
  template,
}: {
  template: {
    _id: Id<'addonTemplates'>;
    name: string;
    description: string;
    iconName: string;
    isPublished: boolean;
    version: number;
    updatedAt: number;
  };
}) {
  const router = useRouter();
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const publishTemplate = usePublishTemplate();
  const unpublishTemplate = useUnpublishTemplate();

  const IconComponent =
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
      template.iconName
    ] ?? Icons.info;

  return (
    <Card
      className='cursor-pointer rounded-card shadow-raised transition-shadow hover:shadow-floating'
      onClick={() => router.push(`/addon-builder/${template._id}`)}
    >
      <CardHeader className='flex flex-row items-start justify-between gap-2 pb-2'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-button bg-bg-interactive'>
            <IconComponent className='size-5 text-primary' />
          </div>
          <div className='min-w-0'>
            <CardTitle className='truncate text-base'>
              {template.name || 'Untitled'}
            </CardTitle>
            <p className='truncate text-sm text-muted-foreground'>
              {template.description || 'No description'}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant='ghost' size='icon' className='size-8 shrink-0'>
              <Icons.more className='size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' onClick={e => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() => router.push(`/addon-builder/${template._id}`)}
            >
              <Icons.edit className='mr-2 size-4' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const newId = await duplicateTemplate(template._id);
                if (newId) router.push(`/addon-builder/${newId}`);
              }}
            >
              <Icons.copy className='mr-2 size-4' />
              Duplicate
            </DropdownMenuItem>
            {template.isPublished ? (
              <DropdownMenuItem onClick={() => unpublishTemplate(template._id)}>
                <Icons.close className='mr-2 size-4' />
                Unpublish
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => publishTemplate(template._id)}>
                <Icons.check className='mr-2 size-4' />
                Publish
              </DropdownMenuItem>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className='text-destructive'
                  onSelect={e => e.preventDefault()}
                >
                  <Icons.trash className='mr-2 size-4' />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className='rounded-modal'>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete add-on?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{template.name}&quot;.
                    Events already using this add-on will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className='rounded-button'>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className='rounded-button bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    onClick={() => deleteTemplate(template._id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='flex items-center gap-2'>
          <Badge
            variant={template.isPublished ? 'default' : 'secondary'}
            className='rounded-badge'
          >
            {template.isPublished ? 'Published' : 'Draft'}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            v{template.version}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateLibrary({
  showHeader = true,
}: { showHeader?: boolean } = {}) {
  const router = useRouter();
  const templates = useMyTemplates();

  if (templates === undefined) {
    return (
      <div className='space-y-4'>
        {showHeader && (
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold'>Add-on Builder</h1>
              <p className='text-muted-foreground'>
                Create custom add-ons for your events
              </p>
            </div>
          </div>
        )}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map(i => (
            <Card key={i} className='rounded-card shadow-raised'>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-3'>
                  <div className='size-10 animate-pulse rounded-button bg-muted' />
                  <div className='space-y-2'>
                    <div className='h-4 w-24 animate-pulse rounded bg-muted' />
                    <div className='h-3 w-32 animate-pulse rounded bg-muted' />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {showHeader ? (
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>Add-on Builder</h1>
            <p className='text-muted-foreground'>
              Create custom add-ons for your events
            </p>
          </div>
          <Button
            className='rounded-button'
            onClick={() => router.push('/addon-builder/new')}
          >
            <Icons.plus className='mr-2 size-4' />
            New Add-on
          </Button>
        </div>
      ) : (
        <div className='flex justify-end'>
          <Button
            className='rounded-button'
            onClick={() => router.push('/addon-builder/new')}
          >
            <Icons.plus className='mr-2 size-4' />
            New Add-on
          </Button>
        </div>
      )}

      {templates.length === 0 ? (
        <Card className='rounded-card shadow-raised'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='flex size-16 items-center justify-center rounded-avatar bg-bg-interactive'>
              <Icons.listChecks className='size-8 text-muted-foreground' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>
              No custom add-ons yet
            </h3>
            <p className='mt-1 text-center text-sm text-muted-foreground'>
              Create your first custom add-on to get started.
            </p>
            <Button
              className='mt-4 rounded-button'
              onClick={() => router.push('/addon-builder/new')}
            >
              <Icons.plus className='mr-2 size-4' />
              Create Add-on
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {templates.map(
            (template: {
              _id: Id<'addonTemplates'>;
              name: string;
              description: string;
              iconName: string;
              isPublished: boolean;
              version: number;
              updatedAt: number;
            }) => (
              <TemplateCard key={template._id} template={template} />
            )
          )}
        </div>
      )}
    </div>
  );
}
