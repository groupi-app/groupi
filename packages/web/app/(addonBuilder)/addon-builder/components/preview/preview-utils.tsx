'use client';

import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import type {
  CustomAddonTemplate,
  SummaryType,
} from '@/lib/custom-addon-schema';

// ===== Variable interpolation for preview =====

const MOCK_VARIABLES: Record<string, string> = {
  // Legacy flat keys
  event_name: 'Sample Event',
  addon_name: 'My Add-on',
  member_count: '8',
  response_count: '3',
  // Dot-path keys (from data blocks)
  'event.title': 'Sample Event',
  'event.location': '123 Main St',
  'event.date': 'Mar 15, 2026',
  'event.memberCount': '8',
  'addon.name': 'My Add-on',
  'addon.responseCount': '3',
  'member.name': 'Alice',
  'member.role': 'Attendee',
  'vote.top_option': 'Option A',
};

export function interpolateVariables(
  text: string,
  templateName?: string
): string {
  const vars = { ...MOCK_VARIABLES };
  if (templateName) {
    vars.addon_name = templateName;
    vars['addon.name'] = templateName;
  }
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const k = key.trim();
    if (vars[k]) return vars[k];
    // Field variables — show a generic mock
    if (k.startsWith('fields.')) return 'Sample answer';
    return `{{${key}}}`;
  });
}

export function mockSummaryValue(type: SummaryType): string {
  switch (type) {
    case 'response_count':
      return '3';
    case 'vote_leader':
      return 'Option A (60%)';
    case 'signup_progress':
      return '5 / 10 spots';
    case 'custom_text':
      return '—';
  }
}

// ===== Shared icon renderer =====

export function AddonIcon({
  iconName,
  className,
}: {
  iconName: string;
  className?: string;
}) {
  const Icon =
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
      iconName
    ] ?? Icons.info;
  return <Icon className={className} />;
}

// ===== Shared addon header =====

export function AddonHeader({ template }: { template: CustomAddonTemplate }) {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex size-10 items-center justify-center rounded-button bg-bg-interactive'>
        <AddonIcon
          iconName={template.iconName}
          className='size-5 text-primary'
        />
      </div>
      <div>
        <h2 className='text-lg font-bold'>
          {template.name || 'Untitled Add-on'}
        </h2>
        {template.description && (
          <p className='text-sm text-muted-foreground'>
            {template.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ===== Settings badges =====

export function SettingsBadges({
  template,
}: {
  template: CustomAddonTemplate;
}) {
  const hasSettings =
    template.settings?.requiresCompletion || template.settings?.cardOnly;

  if (!hasSettings) return null;

  return (
    <div className='flex flex-wrap gap-2'>
      {template.settings?.requiresCompletion && (
        <Badge variant='outline' className='rounded-badge text-xs'>
          <Icons.lock className='mr-1 size-3' />
          Required before viewing event
        </Badge>
      )}
      {template.settings?.cardOnly && (
        <Badge variant='outline' className='rounded-badge text-xs'>
          Card only — no dedicated page
        </Badge>
      )}
    </div>
  );
}

// ===== Preview wrapper =====

export function PreviewWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-card border border-dashed border-primary/30 bg-bg-interactive/30 p-3'>
      <p className='mb-3 text-center text-xs font-medium text-muted-foreground'>
        {label}
      </p>
      {children}
    </div>
  );
}

// ===== Empty state =====

export function EmptyPreview() {
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <div className='flex size-14 items-center justify-center rounded-avatar bg-muted'>
        <Icons.eye className='size-7 text-muted-foreground' />
      </div>
      <p className='mt-3 text-sm font-medium'>Nothing to preview yet</p>
      <p className='mt-1 text-xs text-muted-foreground'>
        Add sections and fields in the Visual tab to see a preview.
      </p>
    </div>
  );
}
