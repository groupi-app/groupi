'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { Loader2, Camera, X } from 'lucide-react';
import { ImageCropModal } from '@/components/image-crop-modal';
import { createLogger } from '@/lib/logger';
import { useUpdateUserProfile } from '@/hooks/convex/use-users';
import { useFileUpload } from '@/hooks/convex/use-file-upload';
import { Id } from '@/convex/_generated/dataModel';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let usersQueries: any;
function initApi() {
  if (!usersQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    usersQueries = api.users?.queries ?? {};
  }
}
initApi();

const logger = createLogger('profile-edit-dialog');

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  pronouns: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  image: z.url().optional().or(z.literal('')),
});

interface ProfileEditDialogProps {
  userInfo: {
    name?: string;
    email: string;
    username?: string;
    image?: string;
    imageKey?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({
  userInfo,
  open,
  onOpenChange,
}: ProfileEditDialogProps) {
  const router = useRouter();
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingImageBlob, setPendingImageBlob] = useState<Blob | null>(null); // Store blob until save
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(
    null
  ); // Blob URL for preview
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user profile to get pronouns and bio from person record
  const userProfile = useQuery(usersQueries.getCurrentUserProfile, {});

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userInfo.name || '',
      pronouns: userProfile?.person?.pronouns || '',
      bio: userProfile?.person?.bio || '',
      image: userInfo.image || '',
    },
  });

  // Use Convex file upload
  const { uploadFile, isUploading } = useFileUpload();

  // Debug: Log state changes
  useEffect(() => {
    logger.debug('State changed', {
      isPending,
      isUploading,
      isSubmitting,
      open,
    });
  }, [isPending, isUploading, isSubmitting, open]);

  // Ref to track pending preview URL for cleanup (avoids stale closure issues)
  const pendingImagePreviewRef = useRef<string | null>(null);
  pendingImagePreviewRef.current = pendingImagePreview;

  // Track previous open state to detect dialog open transition
  const wasOpenRef = useRef(false);

  // Reset form only when dialog transitions from closed to open
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (justOpened && userInfo) {
      form.reset({
        name: userInfo.name || '',
        pronouns: userProfile?.person?.pronouns || '',
        bio: userProfile?.person?.bio || '',
        image: userInfo.image || '',
      });
      // Clean up any previous blob URL to avoid memory leaks
      if (pendingImagePreviewRef.current) {
        URL.revokeObjectURL(pendingImagePreviewRef.current);
      }
      setPendingImageBlob(null);
      setPendingImagePreview(null);
      setUpdateError(null);
    }
  }, [userInfo, open, form, userProfile]);

  useEffect(() => {
    return () => {
      // Component unmounting - revoke blob URL
      if (pendingImagePreviewRef.current) {
        URL.revokeObjectURL(pendingImagePreviewRef.current);
      }
    };
  }, []);

  // Use Convex mutation for profile updates
  const updateProfile = useUpdateUserProfile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Clean up previous blob URL if exists
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }

    // Store blob for upload on save, create preview URL
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPendingImageBlob(croppedBlob);
    setPendingImagePreview(previewUrl);
    form.setValue('image', previewUrl);
  };

  const handleClearAvatar = () => {
    form.setValue('image', '');
    // Clean up blob URL and clear pending image
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImageBlob(null);
    setPendingImagePreview(null);
  };

  // Prevent dialog from closing during submission or upload
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during upload, pending transition, or submission
    if (!newOpen && (isUploading || isPending || isSubmitting)) {
      return;
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    setUpdateError(null);
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        // Determine if we're clearing the image
        const isClearing = !values.image && userInfo.image;

        // Upload pending image blob if exists
        let imageStorageId: Id<'_storage'> | undefined;
        if (pendingImageBlob) {
          const filename = `avatar-${Date.now()}.jpg`;
          const file = new File([pendingImageBlob], filename, {
            type: 'image/jpeg',
          });
          const result = await uploadFile(file);
          if (result) {
            imageStorageId = result.storageId;
          }
        }

        // Update profile using Convex mutation
        await updateProfile({
          name: values.name || undefined,
          pronouns: values.pronouns || undefined,
          bio: values.bio || undefined,
          imageStorageId,
          clearImage: isClearing ? true : undefined,
        });

        // Success - clean up blob URL and close dialog
        if (pendingImagePreview) {
          URL.revokeObjectURL(pendingImagePreview);
        }
        setPendingImageBlob(null);
        setPendingImagePreview(null);
        setIsSubmitting(false);
        handleOpenChange(false);
        // Refresh to update any server components
        router.refresh();
      } catch (err) {
        logger.error('Unexpected error updating profile', { error: err });
        setUpdateError('An unexpected error occurred. Please try again.');
        setIsSubmitting(false);
      }
    });
  };

  const initials = getInitialsFromName(userInfo.name, userInfo.email);
  // eslint-disable-next-line react-hooks/incompatible-library
  const currentImage = form.watch('image');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='sm:max-w-[500px]'
        onInteractOutside={e => {
          // Prevent closing during upload, pending transition, or submission
          if (isUploading || isPending || isSubmitting) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={e => {
          // Prevent closing during upload, pending transition, or submission
          if (isUploading || isPending || isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={e => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            className='space-y-4'
          >
            {/* Profile Picture and Name */}
            <div className='flex items-start gap-4'>
              <div className='flex flex-col items-center gap-2'>
                <div className='relative group'>
                  {isUploading ? (
                    <div className='h-20 w-20 rounded-full bg-muted flex items-center justify-center'>
                      <Loader2 className='h-8 w-8 text-muted-foreground animate-spin' />
                    </div>
                  ) : (
                    <Avatar className='h-20 w-20'>
                      <AvatarImage src={currentImage || ''} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  {!isUploading && (
                    <button
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className='absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed'
                    >
                      <Camera className='h-6 w-6 text-white' />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    className='hidden'
                  />
                </div>
                {isUploading && (
                  <p className='text-xs text-muted-foreground'>Uploading...</p>
                )}
                {!isUploading && (currentImage || userInfo.image) && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleClearAvatar}
                    className='text-xs text-muted-foreground hover:text-destructive'
                  >
                    <X className='h-3 w-3 mr-1' />
                    Remove
                  </Button>
                )}
              </div>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Your name' {...field} />
                    </FormControl>
                    <FormDescription>
                      Click avatar to upload image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='pronouns'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronouns</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., she/her, he/him, they/them'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='bio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Tell us about yourself...'
                      rows={3}
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Maximum 500 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {updateError && (
              <p className='text-sm text-destructive'>{updateError}</p>
            )}

            <div className='flex gap-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => handleOpenChange(false)}
                disabled={isUploading || isPending || isSubmitting}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='flex-1'
                isLoading={isUploading || isPending || isSubmitting}
                loadingText={isUploading ? 'Uploading...' : 'Saving...'}
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Image Crop Modal */}
      {selectedImage && (
        <ImageCropModal
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </Dialog>
  );
}
