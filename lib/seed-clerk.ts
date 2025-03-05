import { seedUsers as users } from "@/data/seed-users";
import { createClerkClient, User } from "@clerk/nextjs/server";
import { db } from "./db";

// wipe all users in clerk
async function wipeUsers(clerkClient: any) {
  const existingUsers = await clerkClient.users.getUserList();
  await Promise.all(
    existingUsers.map((user: User) => clerkClient.users.deleteUser(user.id))
  );
  await db.person.deleteMany();
}

async function seedUsers(clerkClient: any) {
  users.forEach(async (user) => {
    const userObj = await clerkClient.users.createUser({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      emailAddress: [user.email],
    });
    await db.person.create({
      data: {
        id: userObj.id,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        username: userObj.username,
        imageUrl: userObj.imageUrl,
      },
    });
  });
}

async function seedClerk() {
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  await wipeUsers(clerkClient);
  await seedUsers(clerkClient);
}

seedClerk();
