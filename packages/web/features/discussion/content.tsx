'use client';
import { useEffect, useRef, useState } from 'react';
import { safeDiscussionContent, escapeContent } from '@groupi/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileViewDialog } from '@/components/profile-view-dialog';
import type { MentionMember } from './composer';

/** Render the same allowlisted rich HTML accepted by canonical discussion writes. */
export function DiscussionContent({
  content,
  members = [],
  preview = false,
}: {
  content: string;
  members?: (MentionMember & { userId?: string })[];
  preview?: boolean;
}) {
  const [selected, setSelected] = useState<
    (MentionMember & { userId?: string }) | null
  >(null);
  let html: string;
  try {
    html = safeDiscussionContent(content).html;
  } catch {
    html = escapeContent(content);
  }
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    for (const mention of root.current?.querySelectorAll<HTMLElement>(
      '.mention'
    ) ?? []) {
      if (members.some(member => member.personId === mention.dataset.id)) {
        mention.tabIndex = 0;
        mention.setAttribute('role', 'button');
        mention.setAttribute(
          'aria-label',
          `Open profile for ${mention.textContent ?? 'member'}`
        );
      }
    }
  }, [html, members]);
  return (
    <>
      <div
        ref={root}
        onKeyDown={event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          const target =
            event.target instanceof HTMLElement
              ? event.target.closest<HTMLElement>('.mention')
              : null;
          if (target) {
            event.preventDefault();
            target.click();
          }
        }}
        className={`prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words ${preview ? 'max-h-32 overflow-hidden' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={event => {
          const target =
            event.target instanceof Element
              ? event.target.closest('.mention')
              : null;
          const member = members.find(
            item => item.personId === target?.getAttribute('data-id')
          );
          if (member) {
            event.preventDefault();
            setSelected(member);
          }
        }}
      />
      {selected?.userId ? (
        <ProfileViewDialog
          userId={selected.userId}
          open
          onOpenChange={open => {
            if (!open) setSelected(null);
          }}
        />
      ) : (
        <Dialog
          open={selected !== null}
          onOpenChange={open => {
            if (!open) setSelected(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selected?.name || selected?.username || 'Member'}
              </DialogTitle>
            </DialogHeader>
            {selected?.username && <p>@{selected.username}</p>}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
