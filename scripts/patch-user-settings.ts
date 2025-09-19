// scripts/add-user-settings-patch.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addEmptyUserSettings() {
  try {
    console.log('🔍 Checking for users without settings...');

    // Find all users who don't have UserSettings
    const usersWithoutSettings = await prisma.person.findMany({
      where: {
        settings: null,
      },
      select: {
        id: true,
      },
    });

    console.log(
      `📊 Found ${usersWithoutSettings.length} users without settings`
    );

    if (usersWithoutSettings.length === 0) {
      console.log('✅ All users already have settings');
      return;
    }

    // Create default settings for each user
    const defaultSettings = {
      // Add your default settings here based on your schema
      // Example:
      // notifications: true,
      // theme: 'light',
      // language: 'en',
    };

    console.log('📝 Creating user settings...');

    for (const user of usersWithoutSettings) {
      await prisma.personSettings.create({
        data: {
          personId: user.id,
          notificationMethods: {
            create: [],
          },
        },
      });

      console.log(`✅ Created settings for user ${user.id}`);
    }

    console.log(
      `🎉 Successfully added settings for ${usersWithoutSettings.length} users`
    );
  } catch (error) {
    console.error('❌ Error adding user settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addEmptyUserSettings()
  .then(() => {
    console.log('✅ Patch completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Patch failed:', error);
    process.exit(1);
  });
