'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import type { EntityType } from './data-explorer';

const entityConfig: { type: EntityType; label: string; icon: keyof typeof Icons }[] = [
  { type: 'users', label: 'Users', icon: 'users' },
  { type: 'events', label: 'Events', icon: 'calendar' },
  { type: 'posts', label: 'Posts', icon: 'messageSquare' },
  { type: 'replies', label: 'Replies', icon: 'reply' },
  { type: 'memberships', label: 'Memberships', icon: 'people' },
];

interface EntityTabsProps {
  activeTab: EntityType;
  onTabChange: (tab: EntityType) => void;
}

export function EntityTabs({ activeTab, onTabChange }: EntityTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={value => onTabChange(value as EntityType)}>
      <TabsList className="grid w-full grid-cols-5">
        {entityConfig.map(({ type, label, icon }) => {
          const Icon = Icons[icon];
          return (
            <TabsTrigger key={type} value={type} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
