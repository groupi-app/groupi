export function getEventSettingsNav(eventId: string) {
  return [
    {
      title: 'Details',
      href: `/event/${eventId}/settings/details`,
      icon: 'edit' as const,
    },
    {
      title: 'Date & Time',
      href: `/event/${eventId}/settings/date`,
      icon: 'date' as const,
    },
    {
      title: 'Add-ons',
      href: `/event/${eventId}/settings/addons`,
      icon: 'blocks' as const,
    },
    {
      title: 'Permissions',
      href: `/event/${eventId}/settings/permissions`,
      icon: 'shield' as const,
    },
  ];
}
