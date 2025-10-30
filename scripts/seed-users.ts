// prettier-ignore
import 'tsconfig-paths/register';
import { config } from 'dotenv';
import { resolve } from 'path';
import { seedUsers as users } from '../data/seed-users';
import { db } from '../packages/services/src/infrastructure/db';
import {
  createUserAdmin,
  deleteUserAdmin,
} from '../packages/services/src/domains/auth';
import pino from 'pino';

// Load environment variables from the root .env.local first, then web app
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Set defaults for Better Auth if not present (seed script doesn't need real auth)
if (!process.env.BETTER_AUTH_URL) {
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  logger.debug('Set default BETTER_AUTH_URL for seed script');
}
if (!process.env.BETTER_AUTH_SECRET) {
  process.env.BETTER_AUTH_SECRET = 'seed-script-secret';
  logger.debug('Set default BETTER_AUTH_SECRET for seed script');
}
if (!process.env.DISCORD_CLIENT_ID) {
  process.env.DISCORD_CLIENT_ID = 'seed-script-discord-id';
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  process.env.DISCORD_CLIENT_SECRET = 'seed-script-discord-secret';
}
if (!process.env.GOOGLE_CLIENT_ID) {
  process.env.GOOGLE_CLIENT_ID = 'seed-script-google-id';
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  process.env.GOOGLE_CLIENT_SECRET = 'seed-script-google-secret';
}

export default async function seedUsers() {
  try {
    logger.info('Starting user seeding process with Better Auth...');

    // Get existing users from database
    const existingUsers = await db.user.findMany({
      select: { id: true, email: true },
    });
    logger.info(`Found ${existingUsers.length} existing users to clean up`);

    // Delete existing users if they exist
    const deletionPromises = existingUsers.map(async user => {
      try {
        const [error] = await deleteUserAdmin({ userId: user.id });
        if (error) {
          logger.error(`Failed to delete user ${user.id}:`, error);
        } else {
          logger.debug(`Deleted user: ${user.email} (${user.id})`);
        }
      } catch (error: any) {
        logger.error(`Failed to delete user ${user.id}:`, error);
        // Continue even if deletion fails
      }
    });

    // Wait for all deletions to complete
    await Promise.allSettled(deletionPromises);
    logger.info('User cleanup completed');

    // Clear remaining database records in proper order (due to foreign key constraints)
    try {
      await db.notification.deleteMany();
      await db.reply.deleteMany();
      await db.post.deleteMany();
      await db.invite.deleteMany();
      await db.availability.deleteMany();
      await db.potentialDateTime.deleteMany();
      await db.membership.deleteMany();
      await db.event.deleteMany();
      await db.personSettings.deleteMany();
      await db.person.deleteMany();
      await db.verification.deleteMany();
      await db.session.deleteMany();
      await db.account.deleteMany();
      await db.user.deleteMany();
      logger.info('Database tables cleared successfully');
    } catch (dbError) {
      logger.error('Error clearing database:', dbError);
      throw dbError;
    }

    // Wait a bit to ensure database has processed the deletions
    await new Promise(resolve => setTimeout(resolve, 500));

    const createdUsers: Array<{ id: string; email: string }> = [];
    logger.info(`Creating ${users.length} new users...`);

    for (const [index, user] of users.entries()) {
      try {
        // Add a small delay between user creations
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        logger.debug(
          `Creating user: ${user.name} (@${user.username}) - ${user.email}${
            user.role === 'admin' ? ' [ADMIN]' : ''
          }`
        );

        // Use Better Auth admin API to create user
        const [error, result] = await createUserAdmin({
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role || 'user',
          image: undefined, // No default image
        });

        if (error) {
          logger.error(`Failed to create user ${user.email}:`, error);
          throw error;
        }

        if (result) {
          logger.debug(
            `Created user and person: ${user.name} (${result.id}) - ${user.email}`
          );

          // Create PersonSettings for the new user
          try {
            await db.personSettings.create({
              data: {
                personId: result.id,
              },
            });
            logger.debug(`Created settings for user: ${user.name}`);
          } catch (settingsError) {
            logger.warn(
              `Failed to create settings for ${user.name}:`,
              settingsError
            );
            // Non-fatal, continue
          }

          createdUsers.push({ id: result.id, email: user.email });
        }
      } catch (error: any) {
        // Check if user already exists
        if (
          error?.message?.includes('Unique constraint') ||
          error?.code === 'P2002'
        ) {
          logger.warn(`User ${user.email} already exists, skipping...`);
          // Try to find the existing user
          try {
            const existingUser = await db.user.findUnique({
              where: { email: user.email },
            });
            if (existingUser) {
              createdUsers.push({
                id: existingUser.id,
                email: existingUser.email,
              });
              logger.debug(
                `User already exists in database: ${existingUser.email}`
              );
            }
          } catch (findError) {
            logger.error(
              `Could not find existing user ${user.email}:`,
              findError
            );
          }
        } else {
          logger.error(`Failed to create user ${user.email}:`, error);
          throw error;
        }
      }
    }

    logger.info(
      `Successfully seeded ${createdUsers.length} users out of ${users.length} expected`
    );
    if (createdUsers.length >= users.length) {
      logger.info('All users seeded successfully');
      return true;
    } else {
      logger.warn('Some users may not have been seeded, but proceeding...');
      return true;
    }
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers()
    .then(() => {
      logger.info('Seed script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}
