'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// TODO: Migrate profile functionality to server actions
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
import { useUploadThing } from '@/lib/uploadthing';
import { createLogger } from '@/lib/logger';

const logger = createLogger('profile-edit-dialog');

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  pronouns: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  image: z.url().optional().or(z.literal('')),
});

interface ProfileEditDialogProps {
  userInfo: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    imageKey?: string | null;
    pronouns?: string | null;
    bio?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({
  userInfo,
  open,
  onOpenChange,
}: ProfileEditDialogProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // TODO: Migrate to server actions - these variables are unused until migration
  // const [newImageKey, setNewImageKey] = useState<string | null>(null);
  const [_newImageKey, setNewImageKey] = useState<string | null>(null);
  const [uploadedButNotSaved, setUploadedButNotSaved] = useState<string | null>(
    null
  ); // Track uploads that need cleanup on cancel
  const fileInputRef = useRef<HTMLInputElement>(null);

  // const router = useRouter();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userInfo.name || '',
      pronouns: userInfo.pronouns || '',
      bio: userInfo.bio || '',
      image: userInfo.image || '',
    },
  });

  // Use UploadThing's built-in loading state
  const { startUpload, isUploading } = useUploadThing('avatarUploader');

  // Reset form when dialog opens with fresh user data
  useEffect(() => {
    if (open && userInfo) {
      form.reset({
        name: userInfo.name || '',
        pronouns: userInfo.pronouns || '',
        bio: userInfo.bio || '',
        image: userInfo.image || '',
      });
      // Reset the new image key state to prevent stale data
      setNewImageKey(null);
      setUploadedButNotSaved(null);
    }
  }, [userInfo, open, form]);

  // Cleanup uploaded but unsaved images when dialog closes without saving
  useEffect(() => {
    if (!open && uploadedButNotSaved) {
      // Dialog closed without saving - delete the uploaded image
      (async () => {
        try {
          const response = await fetch('/api/uploadthing/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileKey: uploadedButNotSaved }),
          });
          if (!response.ok) {
            logger.error(
              { fileKey: uploadedButNotSaved },
              'Failed to cleanup unsaved upload'
            );
          }
        } catch (error) {
          logger.error(
            { error, fileKey: uploadedButNotSaved },
            'Error cleaning up unsaved upload'
          );
        }
        setUploadedButNotSaved(null);
      })();
    }
  }, [open, uploadedButNotSaved]);

  // TODO: Migrate to server actions
  // Commented out trpc calls until migration is complete
  // const utils = trpc.useUtils();
  // const updateMutation = trpc.person.update.useMutation({
  //   onSuccess: async () => {
  //     // Invalidate tRPC queries
  //     await utils.person.getCurrent.invalidate();
  //
  //     // Trigger a router refresh to revalidate server components and refetch session
  //     router.refresh();
  //
  //     onOpenChange(false);
  //   },
  // });

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

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to File for UploadThing
    const filename = `${userInfo.id}-avatar-${Date.now()}.jpg`;
    const file = new File([croppedBlob], filename, {
      type: 'image/jpeg',
    });

    try {
      // Upload to UploadThing (isUploading automatically managed by hook)
      const result = await startUpload([file]);

      if (result && result[0]) {
        // Extract file key from URL (format: https://utfs.io/f/{fileKey})
        const fileKey = result[0].key;

        // Update form with new image URL and store the key
        form.setValue('image', result[0].url);
        setNewImageKey(fileKey);

        // Track this upload for cleanup if user cancels
        setUploadedButNotSaved(fileKey);
      }
    } catch (error) {
      logger.error({ error }, 'Image upload failed');
    }
  };

  const handleClearAvatar = () => {
    form.setValue('image', '');
    setNewImageKey(null);
  };

  const onSubmit = (_values: z.infer<typeof profileFormSchema>) => {
    // TODO: Migrate to server actions
    // const mutationData = {
    //   userId: userInfo.id,
    //   name: values.name || undefined,
    //   pronouns: values.pronouns || undefined,
    //   bio: values.bio || undefined,
    //   // Keep empty string as empty string (don't convert to undefined)
    //   image: values.image !== undefined ? values.image : undefined,
    //   imageKey: newImageKey || undefined,
    //   oldImageKey: userInfo.imageKey || undefined,
    // };
    //
    // updateMutation.mutate(mutationData);
    //
    // // Clear the uploaded-but-not-saved flag since we're saving now
    // setUploadedButNotSaved(null);

    alert('Profile update functionality is being migrated to server actions');
  };

  const initials = getInitialsFromName(userInfo.name, userInfo.email);
  // eslint-disable-next-line react-hooks/incompatible-library
  const currentImage = form.watch('image');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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

            {/* TODO: Migrate to server actions */}
            {/* {updateMutation.isError && (
              <p className='text-sm text-destructive'>
                Error: {updateMutation.error.message}
              </p>
            )} */}

            <div className='flex gap-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => onOpenChange(false)}
                disabled={isUploading || form.formState.isSubmitting}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isUploading || form.formState.isSubmitting}
                className='flex-1'
              >
                {(isUploading || form.formState.isSubmitting) && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {isUploading ? 'Uploading...' : 'Save'}
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
