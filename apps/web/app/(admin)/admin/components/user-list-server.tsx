import { UserListClient } from './user-list-client';
import { getAllUsersAction } from '@/actions/admin-actions';

export async function UserListServer() {
  const [error, users] = await getAllUsersAction();

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-destructive'>Error loading users: {error.message}</p>
      </div>
    );
  }

  return <UserListClient initialUsers={users || []} />;
}
