'use client';

import { PendingAttachmentsProvider } from '@/contexts/pending-attachments-context';
import { ReactNode } from 'react';

/**
 * Layout for Post sub-route within Event.
 * Provides PendingAttachmentsProvider for attachment handling.
 * Inherits EventDataProvider from parent layout.
 */
export default function PostLayout({ children }: { children: ReactNode }) {
  return <PendingAttachmentsProvider>{children}</PendingAttachmentsProvider>;
}
