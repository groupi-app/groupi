// prettier-ignore
import 'tsconfig-paths/register';
import { config } from 'dotenv';
import { resolve } from 'path';
import { seedUsers as users } from '../data/seed-users';
import { db } from '../packages/services/src/db';
import { createClerkClient } from '@clerk/backend'; // Import createClerkClient
import { createLogger } from '../packages/services/src/logger';

// Load environment variables from the web app's .env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const logger = createLogger('seed-users');

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

    // Clear database
    await db.person.deleteMany();
    logger.info('Database person table cleared');

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

        logger.debug(`Created database person: ${person.username}`);
        people.push(person);
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
                logger.debug(
                  `Added existing user to database: ${person.username}`
                );
              } else {
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

seedUsers();
