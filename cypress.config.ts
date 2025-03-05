import { createClerkClient, User } from "@clerk/nextjs/server";
import { clerkSetup } from "@clerk/testing/cypress";
import { defineConfig } from "cypress";
import { seedUsers as users } from "./data/seed-users";
import { db } from "./lib/db";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        refreshUser: async (username: string) => {
          await db.event.deleteMany({
            where: {
              memberships: {
                some: { person: { username: username }, role: "ORGANIZER" },
              },
            },
          });
          await db.membership.deleteMany({
            where: { person: { username: username } },
          });
          await db.post.deleteMany({
            where: { author: { username: username } },
          });
          await db.reply.deleteMany({
            where: { author: { username: username } },
          });
          return await db.person.findFirst({
            where: { username },
          });
        },
        seedUsers: async () => {
          try {
            const clerkClient = createClerkClient({
              secretKey: process.env.CLERK_SECRET_KEY,
            });
            const existingUsers = await clerkClient.users.getUserList();
            await Promise.all(
              existingUsers.map((user: User) =>
                clerkClient.users.deleteUser(user.id)
              )
            );
            await db.person.deleteMany();
            users.forEach(async (user) => {
              const userObj = await clerkClient.users.createUser({
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                emailAddress: [user.email],
              });
              const firstName = userObj.firstName || "";
              const lastName = userObj.lastName || "";
              const username = userObj.username || "";
              await db.person.create({
                data: {
                  id: userObj.id,
                  firstName,
                  lastName,
                  username,
                  imageUrl: userObj.imageUrl,
                },
              });
            });
            return true;
          } catch (error) {
            console.error("Error seeding users:", error);
            throw error;
          }
        },
      });
      return clerkSetup({ config });
    },
    baseUrl: "http://localhost:3000", // your app's URL
  },
});
