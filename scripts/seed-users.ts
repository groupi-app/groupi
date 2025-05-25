// prettier-ignore
import 'tsconfig-paths/register';
import { seedUsers as users } from '@/data/seed-users';
import { db } from '@/lib/db';
import { createClerkClient, User } from '@clerk/backend'; // Import createClerkClient

export default async function seedUsers() {
  try {
    const clerkClient = createClerkClient({
      // Use createClerkClient
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const { data: existingUsers } = await clerkClient.users.getUserList();
    await Promise.all(
      existingUsers.map((user: User) => clerkClient.users.deleteUser(user.id))
    );
    await db.person.deleteMany();
    const people = [];
    for (const user of users) {
      // Use for...of for sequential async operations
      const userObj = await clerkClient.users.createUser({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        emailAddress: [user.email],
      });
      const firstName = userObj.firstName || '';
      const lastName = userObj.lastName || '';
      const username = userObj.username || '';
      const person = await db.person.create({
        data: {
          id: userObj.id,
          firstName,
          lastName,
          username,
          imageUrl: userObj.imageUrl,
          settings: {
            create: {},
          },
        },
      });
      people.push(person);
    }
    if (people.length == users.length) {
      console.log('Successfully seeded users');
    } else {
      throw new Error();
    }
    return true;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

seedUsers();
