'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/utils/api';
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
import type { UserAdminListItemDTO } from '@groupi/schema';

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserAdminListItemDTO;
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
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'user',
    image: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        role: user.role || 'user',
        image: user.image || '',
      });
    }
  }, [user]);

  const updateMutation = trpc.person.updateById.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: user.id,
      name: formData.name,
      username: formData.username || undefined,
      role: formData.role,
      image: formData.image || undefined,
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
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>

          {updateMutation.isError && (
            <p className='mt-2 text-sm text-destructive'>
              Error: {updateMutation.error.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
