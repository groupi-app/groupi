import { clerkSetup } from '@clerk/testing/cypress';
import { defineConfig } from 'cypress';
import { db } from './lib/db';
import seedUsers from './scripts/seed-users';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        refreshUser: async (username: string) => {
          await db.event.deleteMany({
            where: {
              memberships: {
                some: { person: { username: username }, role: 'ORGANIZER' },
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
            await seedUsers(); // Call the imported function
            return null; // Cypress tasks should return null or a serializable value
          } catch (error) {
            console.error('Error in Cypress task seeding:', error);
            throw error;
          }
        },
      });
      return clerkSetup({ config });
    },
    baseUrl: 'http://localhost:3000', // your app's URL
  },
});
