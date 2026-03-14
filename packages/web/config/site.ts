export const siteConfig = {
  name: 'Groupi',
  description: 'A simple way to create and manage events with your friends.',
  url: 'https://groupi.gg',
  ogImage: 'https://groupi.gg/og.jpg',
  links: {
    github:
      process.env.NEXT_PUBLIC_GITHUB_URL ??
      'https://github.com/groupi-app/groupi',
    discord:
      process.env.NEXT_PUBLIC_DISCORD_URL ?? 'https://discord.gg/6RuMnaT4wM',
  },
};
