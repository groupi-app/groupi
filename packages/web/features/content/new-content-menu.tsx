'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  ListChecks,
  MessageSquare,
  Plus,
  Vote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useMobile } from '@/hooks/use-mobile';

const choices = [
  { kind: 'post', label: 'Post', icon: MessageSquare },
  { kind: 'form', label: 'Form', icon: ClipboardList },
  { kind: 'list', label: 'List', icon: ListChecks },
  { kind: 'poll', label: 'Poll', icon: Vote },
] as const;
type ContentKind = (typeof choices)[number]['kind'];

export function NewContentMenu({
  basePath,
  context,
  allowed,
}: {
  basePath: string;
  context: 'event' | 'group';
  allowed: Record<ContentKind, boolean>;
}) {
  const mobile = useMobile();
  const [open, setOpen] = useState(false);
  if (!Object.values(allowed).some(Boolean)) return null;
  const href = (kind: ContentKind) =>
    `${basePath}/${kind === 'post' ? (context === 'event' ? 'new-post' : 'posts/new') : `${kind}s/new`}`;
  const trigger = (
    <Button
      data-test='new-content-button'
      aria-label='New content'
      className='shrink-0 whitespace-nowrap'
    >
      <Plus aria-hidden='true' data-icon='inline-start' />
      New
    </Button>
  );
  if (mobile)
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New content</DrawerTitle>
            <DrawerDescription>Choose what to share.</DrawerDescription>
          </DrawerHeader>
          <div className='flex flex-col gap-2 px-6 pb-6'>
            {choices.map(({ kind, label, icon: Icon }) =>
              allowed[kind] ? (
                <DrawerClose asChild key={kind}>
                  <Button asChild variant='ghost' className='justify-start'>
                    <Link href={href(kind)}>
                      <Icon aria-hidden='true' data-icon='inline-start' />
                      {label}
                    </Link>
                  </Button>
                </DrawerClose>
              ) : (
                <Button
                  key={kind}
                  variant='ghost'
                  disabled
                  className='justify-start'
                >
                  <Icon aria-hidden='true' data-icon='inline-start' />
                  {label} (unavailable)
                </Button>
              )
            )}
            <DrawerClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    );
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align='end' aria-label='New content'>
        {choices.map(({ kind, label, icon: Icon }) => (
          <DropdownMenuItem
            key={kind}
            disabled={!allowed[kind]}
            asChild={allowed[kind]}
          >
            {allowed[kind] ? (
              <Link href={href(kind)}>
                <Icon aria-hidden='true' />
                {label}
              </Link>
            ) : (
              <>
                <Icon aria-hidden='true' />
                {label} (unavailable)
              </>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
