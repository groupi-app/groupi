'use client';
import type { ReactNode } from 'react';
import { GroupManagementLayout } from '@/features/groups';
export default function Layout({ children }: { children: ReactNode }) {
  return <GroupManagementLayout>{children}</GroupManagementLayout>;
}
