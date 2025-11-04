'use client';

import { useState, useEffect } from 'react';
// TODO: Migrate profile functionality to server actions
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
// import { Loader2 } from 'lucide-react'; // TODO: Uncomment when migration is complete

interface ProfileEditDialogProps {
  userInfo: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
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
  // Initialize form state from userInfo prop
  const getInitialFormData = () => ({
    name: userInfo.name || '',
    pronouns: userInfo.pronouns || '',
    bio: userInfo.bio || '',
    image: userInfo.image || '',
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // TODO: Migrate to server actions
  // Commented out trpc calls until migration is complete
  // const utils = trpc.useUtils();
  // const updateMutation = trpc.person.update.useMutation({
  //   onSuccess: () => {
  //     utils.person.getCurrent.invalidate();
  //     onOpenChange(false);
  //   },
  // });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Migrate to server actions
    // updateMutation.mutate({
    //   userId: userInfo.id,
    //   name: formData.name || undefined,
    //   pronouns: formData.pronouns || undefined,
    //   bio: formData.bio || undefined,
    //   image: formData.image || undefined,
    // });
    alert('Profile update functionality is being migrated to server actions');
  };

  const initials = getInitialsFromName(userInfo.name, userInfo.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Profile Picture Preview */}
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage src={formData.image || userInfo.image || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <Label htmlFor='image' className='text-xs'>
                Profile Picture URL
              </Label>
              <Input
                id='image'
                type='url'
                value={formData.image}
                onChange={e =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder='https://...'
                className='mt-1'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='name'>Display Name</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder='Your name'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='pronouns'>Pronouns</Label>
            <Input
              id='pronouns'
              value={formData.pronouns}
              onChange={e =>
                setFormData({ ...formData, pronouns: e.target.value })
              }
              placeholder='e.g., she/her, he/him, they/them'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='bio'>Bio</Label>
            <Textarea
              id='bio'
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder='Tell us about yourself...'
              rows={3}
              className='resize-none'
            />
          </div>

          {/* TODO: Migrate to server actions */}
          {/* {updateMutation.isError && (
            <p className='text-sm text-destructive'>
              Error: {updateMutation.error.message}
            </p>
          )} */}

          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button type='submit' className='flex-1'>
              {/* {updateMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )} */}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
