import { Suspense } from 'react';
import type { Metadata } from 'next';
import { InviteDetails } from './components/invite-details';
import { InviteDetailsSkeleton } from '@/components/skeletons/invite-details-skeleton';

type Props = {
  params: Promise<{ inviteId: string }>;
};

type InviteOgMeta = {
  title: string;
  location: string | null;
  chosenDateTime: number | null;
  chosenEndDateTime: number | null;
  creatorName: string | null;
};

const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.convex.cloud', '.convex.site');

async function fetchInviteMeta(token: string): Promise<InviteOgMeta | null> {
  if (!convexSiteUrl) return null;

  try {
    const res = await fetch(`${convexSiteUrl}/api/invite-meta/${token}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as InviteOgMeta;
  } catch {
    return null;
  }
}

function formatOgDate(timestamp: number, endTimestamp?: number | null): string {
  const start = new Date(timestamp);
  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (endTimestamp) {
    const end = new Date(endTimestamp);
    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr}, ${timeStr} - ${endTimeStr}`;
  }

  return `${dateStr}, ${timeStr}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { inviteId } = await params;
  const meta = await fetchInviteMeta(inviteId);

  if (!meta) {
    return {
      title: "You're invited! | Groupi",
      description: 'You have been invited to an event on Groupi.',
      openGraph: {
        title: "You're invited!",
        description: 'You have been invited to an event on Groupi.',
        type: 'website',
        siteName: 'Groupi',
      },
    };
  }

  const ogTitle = `You're invited to: ${meta.title}`;

  const descriptionParts: string[] = [];
  if (meta.location) {
    descriptionParts.push(meta.location);
  }
  if (meta.chosenDateTime) {
    descriptionParts.push(
      formatOgDate(meta.chosenDateTime, meta.chosenEndDateTime)
    );
  }
  if (meta.creatorName) {
    descriptionParts.push(`Hosted by ${meta.creatorName}`);
  }

  const ogDescription =
    descriptionParts.length > 0
      ? descriptionParts.join(' · ')
      : 'You have been invited to an event on Groupi.';

  return {
    title: `${ogTitle} | Groupi`,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      siteName: 'Groupi',
    },
  };
}

export default async function InvitePage({ params }: Props) {
  const { inviteId } = await params;

  return (
    <Suspense fallback={<InviteDetailsSkeleton />}>
      <InviteDetails inviteId={inviteId} />
    </Suspense>
  );
}
