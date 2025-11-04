'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { UserAdminListItemData } from '@groupi/schema';
import { deleteUserAction } from '@/actions/admin-actions';
import { EditUserDialog } from './edit-user-dialog';

type SortField = 'name' | 'email' | 'username' | 'createdAt';
type SortOrder = 'asc' | 'desc';

type UserListClientProps = {
  initialUsers: UserAdminListItemData[];
};

export function UserListClient({ initialUsers }: UserListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<UserAdminListItemData | null>(null);
  const [userToDelete, setUserToDelete] =
    useState<UserAdminListItemData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Get values from URL params
  const sortBy = (searchParams.get('sortBy') || 'createdAt') as SortField;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortOrder;
  const searchQuery = searchParams.get('search') || '';

  // Update URL params
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Client-side filtering and sorting
  const filteredAndSortedUsers = initialUsers
    .filter(user => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        user.name?.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.username?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      updateSearchParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSearchParams({ sortBy: field, sortOrder: 'asc' });
    }
  };

  const handleSearchChange = (value: string) => {
    updateSearchParams({ search: value || null });
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className='ml-2 h-4 w-4' />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className='ml-2 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-2 h-4 w-4' />
    );
  };

  const handleEdit = (user: UserAdminListItemData) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: UserAdminListItemData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const [error] = await deleteUserAction({ id: userToDelete.id });

      if (error) {
        toast.error('Failed to delete user', {
          description: error.message,
        });
      } else {
        toast.success('User deleted successfully');
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        router.refresh();
      }
    });
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <div className='space-y-4'>
        {/* Search Bar and Refresh */}
        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search users by name, email, or username...'
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className='pl-9'
            />
          </div>
          <div className='text-sm text-muted-foreground'>
            {filteredAndSortedUsers.length}{' '}
            {filteredAndSortedUsers.length === 1 ? 'user' : 'users'}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        {/* Table */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('name')}
                    className='h-8 px-2 hover:bg-transparent'
                  >
                    User
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('username')}
                    className='h-8 px-2 hover:bg-transparent'
                  >
                    Username
                    {getSortIcon('username')}
                  </Button>
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('createdAt')}
                    className='h-8 px-2 hover:bg-transparent'
                  >
                    Joined
                    {getSortIcon('createdAt')}
                  </Button>
                </TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage
                            src={user.image || ''}
                            alt={user.name ?? user.email}
                          />
                          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>{user.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.username ? (
                        <Badge variant='outline'>@{user.username}</Badge>
                      ) : (
                        <span className='text-sm text-muted-foreground'>
                          No username
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.role?.includes('admin') ? (
                        <Badge variant='default'>Admin</Badge>
                      ) : (
                        <Badge variant='secondary'>User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        {user._count.memberships > 0 && (
                          <Badge variant='secondary'>
                            {user._count.memberships} events
                          </Badge>
                        )}
                        {user._count.posts > 0 && (
                          <Badge variant='secondary'>
                            {user._count.posts} posts
                          </Badge>
                        )}
                        {user._count.replies > 0 && (
                          <Badge variant='secondary'>
                            {user._count.replies} replies
                          </Badge>
                        )}
                        {user._count.memberships === 0 &&
                          user._count.posts === 0 &&
                          user._count.replies === 0 && (
                            <span className='text-sm text-muted-foreground'>
                              No activity
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(user)}
                          disabled={isPending}
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{' '}
              <strong>
                {userToDelete && (userToDelete.name || userToDelete.email)}
              </strong>{' '}
              and all their data including events, posts, and replies. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedUser && (
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onSuccess={handleSuccess}
          onClose={handleCloseEdit}
        />
      )}
    </>
  );
}
