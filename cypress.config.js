import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        refreshUser: async username => {
          // Dynamic import of db
          const { db } = await import('./lib/db.js');

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
            // Dynamic import of seedUsers - use .ts extension in import
            const { default: seedUsersFunction } = await import(
              './scripts/seed-users.ts'
            );
            await seedUsersFunction();
            return null;
          } catch (error) {
            console.error('Error in Cypress task seeding:', error);
            throw error;
          }
        },
      });
      return config;
    },
    baseUrl: 'http://localhost:3000',
  },
});
