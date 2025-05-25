import { PrismaClient } from '@prisma/client';

// This script creates PersonSettings for all existing users who don't have one
async function main() {
  const prisma = new PrismaClient();

  try {
    console.log(
      'Starting migration to ensure all users have PersonSettings...'
    );

    // Get all persons without settings
    const personsWithoutSettings = await prisma.person.findMany({
      where: {
        settings: null,
      },
    });

    console.log(
      `Found ${personsWithoutSettings.length} users without settings`
    );

    // Create settings for each person
    for (const person of personsWithoutSettings) {
      await prisma.personSettings.create({
        data: {
          personId: person.id,
          // No need to explicitly create notificationMethods as it defaults to an empty array
        },
      });
      console.log(`Created settings for user: ${person.username}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
