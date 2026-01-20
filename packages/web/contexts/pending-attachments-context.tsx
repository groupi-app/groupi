'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
} from 'react';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Pending attachment for optimistic rendering
 * Uses preview URLs before real storage URLs are available
 */
export interface PendingAttachment {
  _id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  isSpoiler?: boolean;
  altText?: string;
  /** Preview URL (blob URL) for immediate display */
  url: string | null;
}

interface PendingAttachmentsContextValue {
  /**
   * Get pending attachments for a reply
   */
  getPendingAttachments: (replyId: string) => PendingAttachment[];

  /**
   * Store pending attachments for a reply (for optimistic rendering)
   * Returns a cleanup function to remove them later
   */
  setPendingAttachments: (
    replyId: string,
    attachments: PendingAttachment[]
  ) => () => void;

  /**
   * Clear pending attachments for a reply
   */
  clearPendingAttachments: (replyId: string) => void;

  /**
   * Check if a reply has pending attachments
   */
  hasPendingAttachments: (replyId: string) => boolean;
}

const PendingAttachmentsContext =
  createContext<PendingAttachmentsContextValue | null>(null);

export function PendingAttachmentsProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Map of replyId -> pending attachments
  const [pendingMap, setPendingMap] = useState<
    Map<string, PendingAttachment[]>
  >(new Map());

  const getPendingAttachments = useCallback(
    (replyId: string): PendingAttachment[] => {
      return pendingMap.get(replyId) || [];
    },
    [pendingMap]
  );

  const setPendingAttachments = useCallback(
    (replyId: string, attachments: PendingAttachment[]) => {
      setPendingMap(prev => {
        const next = new Map(prev);
        next.set(replyId, attachments);
        return next;
      });

      // Return cleanup function
      return () => {
        setPendingMap(prev => {
          const next = new Map(prev);
          next.delete(replyId);
          return next;
        });
      };
    },
    []
  );

  const clearPendingAttachments = useCallback((replyId: string) => {
    setPendingMap(prev => {
      const next = new Map(prev);
      next.delete(replyId);
      return next;
    });
  }, []);

  const hasPendingAttachments = useCallback(
    (replyId: string): boolean => {
      const pending = pendingMap.get(replyId);
      return pending !== undefined && pending.length > 0;
    },
    [pendingMap]
  );

  return (
    <PendingAttachmentsContext.Provider
      value={{
        getPendingAttachments,
        setPendingAttachments,
        clearPendingAttachments,
        hasPendingAttachments,
      }}
    >
      {children}
    </PendingAttachmentsContext.Provider>
  );
}

export function usePendingAttachments() {
  const context = useContext(PendingAttachmentsContext);
  if (!context) {
    throw new Error(
      'usePendingAttachments must be used within PendingAttachmentsProvider'
    );
  }
  return context;
}

/**
 * Hook to merge pending attachments with real attachments
 * Returns pending attachments if real attachments are empty/missing
 */
export function useMergedAttachments(
  replyId: string | Id<'replies'>,
  realAttachments?: PendingAttachment[]
): PendingAttachment[] {
  const { getPendingAttachments, clearPendingAttachments } =
    usePendingAttachments();

  const replyIdStr = String(replyId);
  const pendingAttachments = getPendingAttachments(replyIdStr);

  // If real attachments exist and have items, use them and clear pending
  if (realAttachments && realAttachments.length > 0) {
    // Clear pending since real data is available
    if (pendingAttachments.length > 0) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => clearPendingAttachments(replyIdStr), 0);
    }
    return realAttachments;
  }

  // Otherwise, return pending attachments (for optimistic rendering)
  return pendingAttachments;
}
