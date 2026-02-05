'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  changelog,
  type ChangelogEntry,
  type ChangelogSection,
} from '@/lib/_generated-changelog';

const sectionConfig: Record<
  ChangelogSection['type'],
  { label: string; icon: keyof typeof Icons; className: string }
> = {
  added: {
    label: 'Added',
    icon: 'plus',
    className: 'bg-bg-success-subtle text-success border-border-success',
  },
  changed: {
    label: 'Changed',
    icon: 'edit',
    className: 'bg-bg-info-subtle text-info border-border-info',
  },
  deprecated: {
    label: 'Deprecated',
    icon: 'alertTriangle',
    className: 'bg-bg-warning-subtle text-warning border-border-warning',
  },
  removed: {
    label: 'Removed',
    icon: 'trash',
    className: 'bg-bg-error-subtle text-error border-border-error',
  },
  fixed: {
    label: 'Fixed',
    icon: 'check',
    className: 'bg-bg-success-subtle text-success border-border-success',
  },
  security: {
    label: 'Security',
    icon: 'shield',
    className: 'bg-bg-error-subtle text-error border-border-error',
  },
  general: {
    label: 'Notes',
    icon: 'info',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

function ChangelogSectionComponent({ section }: { section: ChangelogSection }) {
  const config = sectionConfig[section.type];
  const IconComponent = Icons[config.icon];

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Badge variant='outline' className={config.className}>
          <IconComponent className='size-3 mr-1' />
          {config.label}
        </Badge>
      </div>
      <ul className='space-y-1 pl-4'>
        {section.items.map((item, index) => (
          <li
            key={index}
            className='text-muted-foreground text-sm list-disc list-inside'
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChangelogEntryComponent({ entry }: { entry: ChangelogEntry }) {
  return (
    <Card className='p-6 space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>v{entry.version}</h2>
        {entry.date && (
          <span className='text-sm text-muted-foreground'>{entry.date}</span>
        )}
      </div>
      <div className='space-y-4'>
        {entry.changes.map((section, index) => (
          <ChangelogSectionComponent key={index} section={section} />
        ))}
      </div>
    </Card>
  );
}

export default function ChangelogPage() {
  return (
    <div className='container max-w-3xl py-8'>
      <div className='mb-8'>
        <Link href='/'>
          <Button variant='ghost' size='sm' className='mb-4'>
            <Icons.arrowLeft className='size-4 mr-1' />
            Back
          </Button>
        </Link>
        <h1 className='text-3xl font-bold'>Changelog</h1>
        <p className='text-muted-foreground mt-2'>
          All notable changes to Groupi are documented here.
        </p>
      </div>

      <div className='space-y-6'>
        {changelog.length === 0 ? (
          <Card className='p-6'>
            <p className='text-muted-foreground text-center'>
              No changelog entries yet.
            </p>
          </Card>
        ) : (
          changelog.map((entry, index) => (
            <ChangelogEntryComponent key={index} entry={entry} />
          ))
        )}
      </div>

      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>
          This project follows{' '}
          <a
            href='https://semver.org'
            target='_blank'
            rel='noopener noreferrer'
            className='underline hover:text-foreground'
          >
            Semantic Versioning
          </a>{' '}
          and uses{' '}
          <a
            href='https://keepachangelog.com'
            target='_blank'
            rel='noopener noreferrer'
            className='underline hover:text-foreground'
          >
            Keep a Changelog
          </a>{' '}
          format.
        </p>
      </div>
    </div>
  );
}
