'use client';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUpdateEvent } from '@/hooks/mutations/use-update-event';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import { Id } from '@/convex/_generated/dataModel';
import {
  EventImageUpload,
  type FocalPoint,
} from '@/components/event-image-upload';

// Visibility type
type Visibility = 'PRIVATE' | 'FRIENDS' | 'PUBLIC';

// Visibility options with display labels
const VISIBILITY_OPTIONS: Array<{
  value: Visibility;
  label: string;
  description: string;
  disabled?: boolean;
}> = [
  {
    value: 'PRIVATE',
    label: 'Private (invite only)',
    description: 'Only invited members can see and join this event',
  },
  {
    value: 'FRIENDS',
    label: 'Friends can discover',
    description: 'Your friends can find and join this event',
  },
  {
    value: 'PUBLIC',
    label: 'Public (coming soon)',
    description: 'Anyone can find and join this event',
    disabled: true,
  },
];

const formSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required.' })
    .max(100, { message: 'Title must be less than 100 characters.' }),
  description: z
    .string()
    .max(1000, { message: 'Description must be less than 1000 characters.' })
    .optional(),
  location: z
    .string()
    .max(200, { message: 'Location must be less than 200 characters.' })
    .optional(),
  visibility: z.enum(['PRIVATE', 'FRIENDS', 'PUBLIC']).optional(),
});

export default function EditEventInfo({
  eventData,
}: {
  eventData: {
    eventId: Id<'events'>;
    title: string;
    description: string;
    location: string;
    visibility?: Visibility;
    imageUrl?: string | null;
    imageStorageId?: Id<'_storage'>;
    imageFocalPoint?: FocalPoint | null;
  };
}) {
  const {
    eventId,
    title,
    description,
    location,
    visibility,
    imageUrl,
    imageFocalPoint: initialFocalPoint,
  } = eventData;

  const router = useRouter();
  const updateEvent = useUpdateEvent();
  const { uploadFile } = useFileUpload();
  const [isSaving, setIsSaving] = useState(false);

  // Track new file to upload (local file, not yet uploaded)
  const [imageFile, setImageFile] = useState<File | null>(null);
  // Track if user wants to remove the existing image
  const [removeExisting, setRemoveExisting] = useState(false);
  // Track focal point changes
  const [focalPoint, setFocalPoint] = useState<FocalPoint | null>(
    initialFocalPoint ?? null
  );
  // Track if focal point was changed (to know whether to include in update)
  const [focalPointChanged, setFocalPointChanged] = useState(false);

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    // If a new file is selected, we don't need to remove existing (it will be replaced)
    if (file) {
      setRemoveExisting(false);
    }
  };

  const handleRemoveExisting = () => {
    setRemoveExisting(true);
    setImageFile(null);
    // Also clear focal point when removing image
    setFocalPoint(null);
    setFocalPointChanged(true);
  };

  const handleFocalPointChange = (newFocalPoint: FocalPoint | null) => {
    setFocalPoint(newFocalPoint);
    setFocalPointChanged(true);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: title,
      description: description,
      location: location,
      visibility: visibility ?? 'PRIVATE',
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSaving(true);

    try {
      // Handle image upload/removal
      let imageStorageId: Id<'_storage'> | null | undefined = undefined;

      if (imageFile) {
        // Upload new file
        const uploadResult = await uploadFile(imageFile);
        if (!uploadResult) {
          toast.error('Failed to upload image.');
          return;
        }
        imageStorageId = uploadResult.storageId as Id<'_storage'>;
      } else if (removeExisting) {
        // Remove existing image
        imageStorageId = null;
      }
      // If neither, imageStorageId stays undefined (no change)

      // Convert visibility to mutation value
      const visibilityValue =
        data.visibility && data.visibility !== visibility
          ? data.visibility
          : undefined;

      await updateEvent({
        eventId: eventId,
        title: data.title,
        description: data.description,
        location: data.location,
        visibility: visibilityValue,
        // Only include imageStorageId if it changed
        ...(imageStorageId !== undefined && {
          imageStorageId: imageStorageId,
        }),
        // Only include imageFocalPoint if it changed
        ...(focalPointChanged && {
          imageFocalPoint: focalPoint,
        }),
      });

      toast.success('Event updated', {
        description: 'Event details have been updated.',
      });
      router.push(`/event/${eventId}`);
    } catch {
      toast.error('Error editing event', {
        description: 'Failed to edit event details.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter event title' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Tell us a little bit about the event'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a brief description of your event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='location'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder='Enter event location' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='space-y-2'>
          <label className='text-sm font-medium leading-none'>
            Cover Image
          </label>
          <EventImageUpload
            imageUrl={removeExisting ? undefined : imageUrl}
            file={imageFile}
            onFileChange={handleFileChange}
            onRemoveExisting={handleRemoveExisting}
            focalPoint={focalPoint}
            onFocalPointChange={handleFocalPointChange}
          />
          <p className='text-sm text-muted-foreground'>
            Add an optional cover image for your event.
          </p>
        </div>
        <FormField
          control={form.control}
          name='visibility'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Visibility</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || 'PRIVATE'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select who can discover this event' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Control who can discover and join this event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          isLoading={isSaving}
          loadingText='Saving...'
          className='mb-20 md:mb-0'
        >
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
