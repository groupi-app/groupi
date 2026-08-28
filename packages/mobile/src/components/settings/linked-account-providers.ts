export type LinkedAccountProviderIcon =
  | 'logo-discord'
  | 'logo-google'
  | 'link-outline';

export function getProviderIcon(providerId: string): LinkedAccountProviderIcon {
  switch (providerId.toLowerCase()) {
    case 'discord':
      return 'logo-discord';
    case 'google':
      return 'logo-google';
    default:
      return 'link-outline';
  }
}
