'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserAdminListItemData } from '@groupi/schema';
import { updateUserAction } from '@/actions/admin-actions';

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserAdminListItemData;
  onSuccess: () => void;
  onClose: () => void;
};

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  onClose,
}: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Initialize form state from user prop
  const getInitialFormData = () => ({
    name: user.name || '',
    username: user.username || '',
    role: user.role || 'user',
    image: user.image || '',
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form when dialog opens with potentially different user
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const [err] = await updateUserAction({
        id: user.id,
        name: formData.name,
        username: formData.username || undefined,
        role: formData.role,
        image: formData.image || undefined,
      });

      if (err) {
        setError(err.message);
        toast.error('Failed to update user', {
          description: err.message,
        });
      } else {
        toast.success('User updated successfully');
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changes will be reflected across the
              platform.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-name'>Full Name</Label>
              <Input
                id='edit-name'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='John Doe'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-username'>Username</Label>
              <Input
                id='edit-username'
                value={formData.username}
                onChange={e =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder='johndoe'
              />
              <p className='text-sm text-muted-foreground'>
                Must be unique. Only alphanumeric, underscores, and dots.
              </p>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-role'>Role</Label>
              <Select
                value={formData.role}
                onValueChange={value =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id='edit-role'>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='user'>User</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-sm text-muted-foreground'>
                Admins have full access to the admin dashboard
              </p>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-image'>Profile Image URL</Label>
              <Input
                id='edit-image'
                type='url'
                value={formData.image}
                onChange={e =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder='https://example.com/avatar.jpg'
              />
            </div>

            <div className='grid gap-2'>
              <Label>Email</Label>
              <Input value={user.email} disabled />
              <p className='text-sm text-muted-foreground'>
                Email cannot be changed
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>

          {error && (
            <p className='mt-2 text-sm text-destructive'>Error: {error}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
