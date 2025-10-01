// prettier-ignore
import 'tsconfig-paths/register';
import { config } from 'dotenv';
import { resolve } from 'path';
import { seedUsers as users } from '../data/seed-users';
import { db } from '../packages/services/src/infrastructure/db';
import { createClerkClient } from '@clerk/backend';
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

export default async function seedUsers() {
  try {
    const clerkClient = createClerkClient({
      // Use createClerkClient
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    logger.info('Starting user seeding process...');

    // Get existing users
    const { data: existingUsers } = await clerkClient.users.getUserList();
    logger.info(`Found ${existingUsers.length} existing users to clean up`);

    // Delete existing users if they exist
    const deletionPromises = existingUsers.map(async user => {
      try {
        await clerkClient.users.deleteUser(user.id);
        logger.debug(`Deleted user: ${user.id}`);
      } catch (error: any) {
        if (
          error?.errors?.[0]?.code === 'resource_not_found' ||
          error?.status === 404
        ) {
          logger.debug(`User ${user.id} already deleted`);
        } else {
          logger.error(`Failed to delete user ${user.id}:`, error);
        }
        // Continue even if deletion fails
      }
    });

    // Wait for all deletions to complete
    await Promise.allSettled(deletionPromises);
    logger.info('User cleanup completed');

    // Clear database in proper order (due to foreign key constraints)
    try {
      await db.notification.deleteMany();
      await db.membership.deleteMany();
      await db.personSettings.deleteMany();
      await db.person.deleteMany();
      logger.info('Database tables cleared successfully');
    } catch (dbError) {
      logger.error('Error clearing database:', dbError);
      throw dbError;
    }

    // Wait a bit to ensure Clerk has processed the deletions
    await new Promise(resolve => setTimeout(resolve, 1000));

    const people: any[] = [];
    logger.info(`Creating ${users.length} new users...`);

    for (const [index, user] of users.entries()) {
      try {
        // Add a small delay between user creations to avoid rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const userObj = await clerkClient.users.createUser({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          emailAddress: [user.email],
        });

        logger.debug(`Created Clerk user: ${userObj.username} (${userObj.id})`);

        const firstName = userObj.firstName || '';
        const lastName = userObj.lastName || '';
        const username = userObj.username || '';

        try {
          const person = await db.person.create({
            data: {
              id: userObj.id,
              firstName,
              lastName,
              username,
              imageUrl: userObj.imageUrl || '',
              settings: {
                create: {}, // This creates a PersonSettings record
              },
            },
            include: {
              settings: true, // Include settings in the response
            },
          });

          logger.debug(
            `Created database person: ${person.username} with settings: ${person.settings?.id}`
          );
          people.push(person);
        } catch (dbError: any) {
          logger.error(
            `Failed to create database person for ${username}:`,
            dbError
          );
          // Try to clean up the Clerk user if database creation failed
          try {
            await clerkClient.users.deleteUser(userObj.id);
            logger.debug(
              `Cleaned up Clerk user ${userObj.id} after database failure`
            );
          } catch (cleanupError) {
            logger.warn(
              `Failed to clean up Clerk user ${userObj.id}:`,
              cleanupError
            );
          }
          throw dbError;
        }
      } catch (error: any) {
        if (
          error?.errors?.[0]?.code === 'form_identifier_exists' ||
          error?.status === 422
        ) {
          logger.warn(
            `User ${user.username} already exists, trying to handle gracefully...`
          );
          // Try to find the existing user and add to database if needed
          try {
            const existingUser = await clerkClient.users.getUserList({
              username: [user.username],
            });
            if (existingUser.data.length > 0) {
              const userObj = existingUser.data[0];
              logger.debug(
                `Found existing user: ${userObj.username} (${userObj.id})`
              );

              // Check if person exists in database
              const existingPerson = await db.person.findUnique({
                where: { id: userObj.id },
              });

              if (!existingPerson) {
                const firstName = userObj.firstName || '';
                const lastName = userObj.lastName || '';
                const username = userObj.username || '';
                try {
                  const person = await db.person.create({
                    data: {
                      id: userObj.id,
                      firstName,
                      lastName,
                      username,
                      imageUrl: userObj.imageUrl || '',
                      settings: {
                        create: {}, // This creates a PersonSettings record
                      },
                    },
                    include: {
                      settings: true,
                    },
                  });
                  people.push(person);
                  logger.debug(
                    `Added existing user to database: ${person.username} with settings: ${person.settings?.id}`
                  );
                } catch (dbError) {
                  logger.error(
                    `Failed to add existing user ${username} to database:`,
                    dbError
                  );
                  throw dbError;
                }
              } else {
                // Check if PersonSettings exist, create if not
                if (!existingPerson.settings) {
                  try {
                    await db.personSettings.create({
                      data: {
                        personId: existingPerson.id,
                      },
                    });
                    logger.debug(
                      `Created missing settings for existing person: ${existingPerson.username}`
                    );
                  } catch (settingsError) {
                    logger.warn(
                      `Failed to create settings for ${existingPerson.username}:`,
                      settingsError
                    );
                  }
                }
                people.push(existingPerson);
                logger.debug(
                  `User already exists in database: ${existingPerson.username}`
                );
              }
            }
          } catch (findError) {
            logger.error(
              `Could not find or process existing user ${user.username}:`,
              findError
            );
          }
        } else {
          logger.error(`Failed to create user ${user.username}:`, error);
          throw error;
        }
      }
    }

    logger.info(
      `Successfully seeded ${people.length} users out of ${users.length} expected`
    );
    if (people.length >= users.length) {
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
