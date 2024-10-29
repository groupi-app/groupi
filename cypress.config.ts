import { clerkSetup } from "@clerk/testing/cypress";
import { defineConfig } from "cypress";
import { db } from "./lib/db";

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
      });
      return clerkSetup({ config });
    },
    baseUrl: "http://localhost:3000", // your app's URL
  },
});
