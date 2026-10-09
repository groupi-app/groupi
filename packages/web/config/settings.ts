export const settingsConfig = {
  settingsNav: [
    {
      title: 'Invite lists',
      href: '/settings/invite-lists',
      icon: 'people' as const,
    },
    {
      title: 'Notifications',
      href: '/settings/notifications',
      icon: 'bell' as const,
    },
    {
      title: 'Account',
      href: '/settings/account',
      icon: 'account' as const,
    },
    {
      title: 'Privacy',
      href: '/settings/privacy',
      icon: 'shield' as const,
    },
    {
      title: 'Appearance',
      href: '/settings/appearance',
      icon: 'palette' as const,
    },
    {
      title: 'Add-ons',
      href: '/settings/custom-addons',
      icon: 'blocks' as const,
      badge: 'Experimental' as const,
    },
  ],
};
