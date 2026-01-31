'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { authClient } from '@/lib/auth-client';

// Use dynamic require to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('@/convex/_generated/api') as { api: any };
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

type User = {
  id: string;
  personId: Id<'persons'>;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  role: string;
  createdAt: number;
  _count: {
    memberships: number;
  };
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<
    'ban' | 'unban' | 'promote' | 'demote' | 'delete' | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    // Simple debounce using setTimeout
    setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  // Fetch users
  const usersData = useQuery(api.admin.queries.getUsersAdmin, {
    search: debouncedSearch || undefined,
    limit: 50,
  });

  // Mutations
  const deletePerson = useMutation(api.admin.mutations.deletePerson);

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    setIsLoading(true);

    try {
      switch (actionType) {
        case 'promote':
          // Use Better Auth admin API to promote user
          await authClient.admin.setRole({
            userId: selectedUser.id,
            role: 'admin',
          });
          toast.success(
            `${selectedUser.name || selectedUser.email} promoted to admin`
          );
          break;

        case 'demote':
          // Use Better Auth admin API to demote user
          await authClient.admin.setRole({
            userId: selectedUser.id,
            role: 'user',
          });
          toast.success(
            `${selectedUser.name || selectedUser.email} demoted to user`
          );
          break;

        case 'ban':
          // Use Better Auth admin API to ban user
          await authClient.admin.banUser({
            userId: selectedUser.id,
          });
          toast.success(
            `${selectedUser.name || selectedUser.email} has been banned`
          );
          break;

        case 'unban':
          // Use Better Auth admin API to unban user
          await authClient.admin.unbanUser({
            userId: selectedUser.id,
          });
          toast.success(
            `${selectedUser.name || selectedUser.email} has been unbanned`
          );
          break;

        case 'delete':
          // Delete person and all related data via Convex
          await deletePerson({ personId: selectedUser.personId });
          toast.success(
            `${selectedUser.name || selectedUser.email} has been deleted`
          );
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const getActionDialogContent = () => {
    if (!selectedUser || !actionType) return null;

    const configs = {
      promote: {
        title: 'Promote to Admin',
        description: `Are you sure you want to promote ${selectedUser.name || selectedUser.email} to admin? They will have full administrative access.`,
        confirmText: 'Promote',
        variant: 'default' as const,
      },
      demote: {
        title: 'Demote to User',
        description: `Are you sure you want to demote ${selectedUser.name || selectedUser.email} to a regular user? They will lose administrative access.`,
        confirmText: 'Demote',
        variant: 'default' as const,
      },
      ban: {
        title: 'Ban User',
        description: `Are you sure you want to ban ${selectedUser.name || selectedUser.email}? They will not be able to sign in.`,
        confirmText: 'Ban User',
        variant: 'destructive' as const,
      },
      unban: {
        title: 'Unban User',
        description: `Are you sure you want to unban ${selectedUser.name || selectedUser.email}? They will be able to sign in again.`,
        confirmText: 'Unban User',
        variant: 'default' as const,
      },
      delete: {
        title: 'Delete User',
        description: `Are you sure you want to permanently delete ${selectedUser.name || selectedUser.email}? This will delete all their events, posts, and data. This action cannot be undone.`,
        confirmText: 'Delete User',
        variant: 'destructive' as const,
      },
    };

    return configs[actionType];
  };

  const dialogContent = getActionDialogContent();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Users</h1>
        <p className='text-muted-foreground'>
          Manage user accounts and permissions
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search by name, email, or username</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search users...'
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className='pl-9'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Users
            {usersData && (
              <span className='ml-2 text-sm font-normal text-muted-foreground'>
                ({usersData.totalCount} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!usersData ? (
            <div className='flex items-center justify-center py-8'>
              <Icons.spinner className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : usersData.users.length === 0 ? (
            <p className='text-center py-8 text-muted-foreground'>
              No users found
            </p>
          ) : (
            <div className='space-y-2'>
              {usersData.users.map((user: User) => (
                <div
                  key={user.id}
                  className='flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-center gap-4'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>{user.name || 'No name'}</p>
                        {user.role === 'admin' && (
                          <Badge variant='default' className='text-xs'>
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {user.email}
                        {user.username && (
                          <span className='ml-2'>@{user.username}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-4'>
                    <div className='text-right text-sm text-muted-foreground'>
                      <p>{user._count.memberships} events</p>
                      <p>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <Icons.moreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {user.role !== 'admin' ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user as User);
                              setActionType('promote');
                            }}
                          >
                            <Icons.shieldPlus className='h-4 w-4 mr-2' />
                            Promote to Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user as User);
                              setActionType('demote');
                            }}
                          >
                            <Icons.shieldMinus className='h-4 w-4 mr-2' />
                            Demote to User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user as User);
                            setActionType('ban');
                          }}
                          className='text-warning'
                        >
                          <Icons.ban className='h-4 w-4 mr-2' />
                          Ban User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user as User);
                            setActionType('delete');
                          }}
                          className='text-destructive'
                        >
                          <Icons.trash className='h-4 w-4 mr-2' />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedUser && !!actionType}
        onOpenChange={open => {
          if (!open) {
            setSelectedUser(null);
            setActionType(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>{dialogContent?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setSelectedUser(null);
                setActionType(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={dialogContent?.variant}
              onClick={handleAction}
              isLoading={isLoading}
              loadingText='Processing...'
            >
              {dialogContent?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
