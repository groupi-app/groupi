import { clerkSetup } from "@clerk/testing/cypress";
import { defineConfig } from "cypress";
import { db } from "./lib/db";
import { SeedUser, seedUsers as users } from "./data/seed-users";
import { createClerkClient, User } from "@clerk/nextjs/server";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        refreshUser: async (username: string) => {
          console.log("TESTING: Refreshing user", username);
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
          console.log(process.env.DATABASE_URL);
          try {
            const clerkClient = createClerkClient({
              secretKey: process.env.CLERK_SECRET_KEY,
            });
            const existingUsers = await clerkClient.users.getUserList();
            existingUsers.forEach((user: User) => {
              console.log(user.id);
            });
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
