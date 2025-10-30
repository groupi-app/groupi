'use client';

import { useState } from 'react';
import { trpc } from '@/lib/utils/api';
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UserAdminListItemDTO } from '@groupi/schema';

type SortField = 'name' | 'email' | 'username' | 'createdAt';
type SortOrder = 'asc' | 'desc';

type UserListProps = {
  onEdit: (user: UserAdminListItemDTO) => void;
  onSuccess: () => void;
};

export function UserList({ onEdit, onSuccess }: UserListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAdminListItemDTO | null>(
    null
  );
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const { data: usersResult, refetch } = trpc.person.listAll.useQuery();
  const allUsers = usersResult?.[1] || [];

  // Client-side filtering and sorting
  const filteredAndSortedUsers = allUsers
    .filter(user => {
      if (!debouncedSearch) return true;
      const search = debouncedSearch.toLowerCase();
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

  const users = filteredAndSortedUsers;

  const deleteMutation = trpc.person.delete.useMutation({
    onSuccess: () => {
      onSuccess();
      refetch();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
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

  const handleDelete = (user: UserAdminListItemDTO) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate({ id: userToDelete.id });
    }
  };

  return (
    <>
      <div className='space-y-4'>
        {/* Search Bar */}
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
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </div>
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
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8'>
                    <p className='text-muted-foreground'>No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
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
                          onClick={() => onEdit(user)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(user)}
                          disabled={deleteMutation.isPending}
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
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
