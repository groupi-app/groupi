export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type MainNavItem = NavItem;

export type SettingsNavItem = NavItem;

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
};

export type NavConfig = {
  mainNav: MainNavItem[];
};

export type SettingsNavConfig = {
  settingsNav: SettingsNavItem[];
};

export type ActionResponse<T> = {
  success?: T;
  error?: string;
};

// Import types from schema package and export with backward compatible names
export type { DateOptionDTO as PotentialDateTimeWithAvailabilities } from '@groupi/schema';
export type { MembershipDTO as MembershipWithAvailabilities } from '@groupi/schema';
export type { MembershipWithPersonDTO as Member } from '@groupi/schema';
