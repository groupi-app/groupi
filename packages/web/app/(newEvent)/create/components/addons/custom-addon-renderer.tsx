'use client';

import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useGlobalUser } from '@/context/global-user-context';
import {
  useAddonData,
  useSetAddonData,
  useMyAddonData,
  useExecuteFieldActions,
} from '@/hooks/convex/use-addons';
import type { Id } from '@/convex/_generated/dataModel';
import {
  isDisplayField,
  SUMMARY_TYPE_LABELS,
  type CustomAddonTemplate,
  type CustomAddonConfig,
  type TemplateField,
  type TemplateSection,
  type CalloutVariant,
} from '@/lib/custom-addon-schema';
import { evaluateVisibilityConditions } from '@/lib/condition-evaluator';
import {
  ConfigurableFieldEditor,
  ConfigurableSectionEditor,
} from './custom-addon-config-editor';
import type {
  AddonConfigProps,
  EventCardProps,
  ManageConfigProps,
  AddonPageProps,
} from '../addon-registry';

// ===== Helper to extract template from config =====

function getTemplate(
  config: Record<string, unknown> | null
): CustomAddonTemplate | null {
  if (!config) return null;
  const c = config as unknown as CustomAddonConfig;
  return c.template ?? null;
}

// ===== Field Renderers =====

function renderField(
  field: TemplateField,
  value: unknown,
  onChange: (value: unknown) => void
) {
  switch (field.type) {
    case 'text':
      return field.variant === 'long' ? (
        <Textarea
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          rows={3}
          className='resize-none rounded-input'
        />
      ) : (
        <Input
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className='rounded-input'
        />
      );

    case 'number':
      return (
        <Input
          type='number'
          value={(value as number) ?? ''}
          onChange={e =>
            onChange(e.target.value ? parseFloat(e.target.value) : undefined)
          }
          min={field.min}
          max={field.max}
          className='rounded-input'
        />
      );

    case 'select':
      return (
        <Select value={(value as string) ?? ''} onValueChange={onChange}>
          <SelectTrigger className='rounded-input'>
            <SelectValue placeholder='Select...' />
          </SelectTrigger>
          <SelectContent className='rounded-dropdown'>
            {field.options?.map(opt => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiselect': {
      const selected = (value as string[]) ?? [];
      return (
        <div className='space-y-1'>
          {field.options?.map(opt => (
            <label key={opt} className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={checked => {
                  if (checked) {
                    onChange([...selected, opt]);
                  } else {
                    onChange(selected.filter(s => s !== opt));
                  }
                }}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    case 'yesno':
      return (
        <div className='flex items-center gap-2'>
          <Switch
            checked={(value as boolean) ?? false}
            onCheckedChange={onChange}
          />
          <span className='text-sm text-muted-foreground'>
            {value ? 'Yes' : 'No'}
          </span>
        </div>
      );

    default:
      return (
        <p className='text-sm text-muted-foreground'>
          Unsupported field type: {field.type}
        </p>
      );
  }
}

// ===== Display Field Renderers =====

function interpolateVariables(
  text: string,
  config: CustomAddonTemplate | null,
  fieldValues?: Record<string, unknown>
): string {
  const vars: Record<string, string> = {
    addon_name: config?.name ?? 'Add-on',
  };
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmed = key.trim();

    // Resolve {{fields.*}} paths
    if (trimmed.startsWith('fields.') && fieldValues) {
      const fieldId = trimmed.slice('fields.'.length);
      const value = fieldValues[fieldId];
      if (value === undefined || value === null) return '';
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return String(value);
    }

    return vars[trimmed] ?? match;
  });
}

function DynamicSummaryField({
  field,
  eventId,
  addonType,
}: {
  field: TemplateField;
  eventId: Id<'events'>;
  addonType: string;
}) {
  const addonData = useAddonData(eventId, addonType);
  const summaryType = field.summaryType ?? 'response_count';
  const label =
    field.summaryLabel || SUMMARY_TYPE_LABELS[summaryType] || 'Summary';

  const value = useMemo(() => {
    const entries = addonData ?? [];

    switch (summaryType) {
      case 'response_count': {
        const count = entries.filter((d: { key: string }) =>
          d.key.startsWith('response:')
        ).length;
        return String(count);
      }

      case 'vote_leader': {
        const voteCounts: Record<string, number> = {};
        for (const entry of entries) {
          if (!entry.key.startsWith('vote:')) continue;
          const data = entry.data as { options?: string[] };
          for (const opt of data.options ?? []) {
            voteCounts[opt] = (voteCounts[opt] ?? 0) + 1;
          }
        }
        const sorted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);
        if (sorted.length === 0) return 'No votes yet';
        const total = Object.values(voteCounts).reduce((a, b) => a + b, 0);
        const pct = Math.round((sorted[0][1] / total) * 100);
        return `${sorted[0][0]} (${pct}%)`;
      }

      case 'signup_progress': {
        let claimed = 0;
        let capacity = 0;
        for (const entry of entries) {
          if (!entry.key.startsWith('claims:')) continue;
          const data = entry.data as Record<string, number>;
          for (const qty of Object.values(data)) {
            claimed += qty;
          }
        }
        // Estimate capacity from template fields if possible
        capacity = claimed + 5; // fallback
        return `${claimed} / ${capacity} spots`;
      }

      case 'custom_text':
        return field.summaryLabel || '—';
    }
  }, [addonData, summaryType, field.summaryLabel]);

  return (
    <div className='flex items-center justify-between rounded-card border bg-muted/50 p-3'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className='text-sm font-bold'>{value}</span>
    </div>
  );
}

function DisplayFieldRenderer({
  field,
  eventId,
  addonType,
  template,
  fieldValues,
}: {
  field: TemplateField;
  eventId: Id<'events'>;
  addonType: string;
  template: CustomAddonTemplate | null;
  fieldValues?: Record<string, unknown>;
}) {
  switch (field.type) {
    case 'action_button':
      return (
        <ActionButtonField
          field={field}
          eventId={eventId}
          addonType={addonType}
        />
      );

    case 'static_text': {
      const text = field.content
        ? interpolateVariables(field.content, template, fieldValues)
        : 'No content set';
      switch (field.textFormat) {
        case 'h1':
          return <h1 className='text-2xl font-bold'>{text}</h1>;
        case 'h2':
          return <h2 className='text-xl font-semibold'>{text}</h2>;
        case 'h3':
          return <h3 className='text-lg font-semibold'>{text}</h3>;
        default:
          return <p className='whitespace-pre-wrap text-sm'>{text}</p>;
      }
    }

    case 'dynamic_summary':
      return (
        <DynamicSummaryField
          field={field}
          eventId={eventId}
          addonType={addonType}
        />
      );

    case 'divider':
      return field.dividerLabel ? (
        <div className='flex items-center gap-3 py-1'>
          <hr className='flex-1 border-t border-border' />
          <span className='shrink-0 text-xs text-muted-foreground'>
            {field.dividerLabel}
          </span>
          <hr className='flex-1 border-t border-border' />
        </div>
      ) : (
        <hr className='my-1 border-t border-border' />
      );

    case 'info_callout': {
      const variant: CalloutVariant = field.calloutVariant ?? 'info';
      const variantClasses: Record<CalloutVariant, string> = {
        info: 'border-border bg-bg-info-subtle',
        warning: 'border-border bg-bg-warning-subtle',
        success: 'border-border-success bg-bg-success-subtle',
      };
      const textClasses: Record<CalloutVariant, string> = {
        info: 'text-info',
        warning: 'text-warning',
        success: 'text-success',
      };
      return (
        <div className={`rounded-card border p-3 ${variantClasses[variant]}`}>
          <p className={`text-sm ${textClasses[variant]}`}>
            {field.calloutMessage
              ? interpolateVariables(
                  field.calloutMessage,
                  template,
                  fieldValues
                )
              : ''}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}

// ===== Helpers for detecting configurable content =====

function hasConfigurableContent(template: CustomAddonTemplate): boolean {
  return template.sections.some(
    s => s.configurable || s.fields.some(f => f.configurable)
  );
}

// ===== Create Config Component =====

export function CustomAddonCreateConfig({
  formState,
  setFormState,
  addonId,
}: AddonConfigProps & { addonId: string }) {
  const config = formState.addonConfigs?.[addonId] as
    | Record<string, unknown>
    | undefined;
  const template = config?.template as CustomAddonTemplate | undefined;

  if (!template || !hasConfigurableContent(template)) {
    return (
      <div className='rounded-card border p-3'>
        <p className='text-sm text-muted-foreground'>
          This custom add-on will be attached to the event with its current
          configuration.
        </p>
      </div>
    );
  }

  const updateTemplate = (updated: CustomAddonTemplate) => {
    setFormState({
      ...formState,
      addonConfigs: {
        ...formState.addonConfigs,
        [addonId]: { ...config, template: updated },
      },
    });
  };

  const updateSection = (sectionIndex: number, updated: TemplateSection) => {
    const newSections = [...template.sections];
    newSections[sectionIndex] = updated;
    updateTemplate({ ...template, sections: newSections });
  };

  const updateFieldInSection = (
    sectionIndex: number,
    fieldId: string,
    updated: TemplateField
  ) => {
    const section = template.sections[sectionIndex];
    const newFields = section.fields.map(f => (f.id === fieldId ? updated : f));
    updateSection(sectionIndex, { ...section, fields: newFields });
  };

  return (
    <div className='space-y-3'>
      <p className='text-sm text-muted-foreground'>
        Configure this add-on for your event:
      </p>
      {template.sections.map((section, si) => (
        <div key={section.id} className='space-y-2'>
          {/* Configurable fields within the section */}
          {section.fields
            .filter(f => f.configurable)
            .map(field => (
              <ConfigurableFieldEditor
                key={field.id}
                field={field}
                onChange={updated =>
                  updateFieldInSection(si, field.id, updated)
                }
              />
            ))}

          {/* Configurable section (organizer adds fields) */}
          {section.configurable && (
            <ConfigurableSectionEditor
              section={section}
              onChange={updated => updateSection(si, updated)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ===== Event Card Component =====

/** Card-safe field types that can render inline on a compact card */
const CARD_SAFE_FIELD_TYPES: Set<string> = new Set(['toggle', 'action_button']);

function formatCardSubtitle(
  subtitleTemplate: string,
  responseCount: number
): string {
  return subtitleTemplate.replace(
    /\{\{response_count\}\}/g,
    String(responseCount)
  );
}

export function CustomAddonEventCard({
  eventId,
  config,
  addonType,
}: EventCardProps & { addonType: string }) {
  const template = getTemplate(config);
  const addonData = useAddonData(eventId, addonType ?? '');

  if (!template) return null;

  const IconComponent =
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
      template.iconName
    ] ?? Icons.info;

  const responseCount = (addonData ?? []).filter((d: { key: string }) =>
    d.key.startsWith('response:')
  ).length;

  const settings = template.settings;
  const isCardOnly = settings?.cardOnly ?? false;

  const subtitle = settings?.cardSubtitle
    ? formatCardSubtitle(settings.cardSubtitle, responseCount)
    : `${responseCount} ${responseCount === 1 ? 'response' : 'responses'}`;

  // Collect card-safe fields for card-only mode
  const cardFields = isCardOnly
    ? template.sections
        .flatMap(s => s.fields)
        .filter(f => CARD_SAFE_FIELD_TYPES.has(f.type))
    : [];

  return (
    <Card className='w-fit rounded-card shadow-raised'>
      <CardContent className='flex items-center gap-3 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-button bg-bg-interactive'>
          <IconComponent className='size-5 text-primary' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate font-medium'>{template.name}</p>
          <p className='text-sm text-muted-foreground'>{subtitle}</p>
        </div>
        {isCardOnly ? (
          cardFields.length > 0 && (
            <div className='flex shrink-0 items-center gap-2'>
              {cardFields.map(field =>
                field.type === 'toggle' ? (
                  <ToggleField
                    key={field.id}
                    field={field}
                    eventId={eventId}
                    addonType={addonType}
                  />
                ) : field.type === 'action_button' ? (
                  <ActionButtonField
                    key={field.id}
                    field={field}
                    eventId={eventId}
                    addonType={addonType}
                  />
                ) : null
              )}
            </div>
          )
        ) : (
          <Button
            variant='outline'
            size='sm'
            className='shrink-0 rounded-button'
            asChild
          >
            <a href={`/event/${eventId}/addon/${addonType}`}>
              {settings?.cardLinkLabel || 'View'}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Manage Config Component =====

export function CustomAddonManageConfig({
  config,
  onSave,
  onDisable,
  isSaving,
}: ManageConfigProps) {
  const template = getTemplate(config);
  const [isOpen, setIsOpen] = useState(false);
  const [editedTemplate, setEditedTemplate] =
    useState<CustomAddonTemplate | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  if (!template) return null;

  const isConfigurable = hasConfigurableContent(template);

  const IconComponent =
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
      template.iconName
    ] ?? Icons.info;

  const workingTemplate = editedTemplate ?? template;

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !editedTemplate) {
      setEditedTemplate(structuredClone(template));
    }
  };

  const handleTemplateChange = (updated: CustomAddonTemplate) => {
    setEditedTemplate(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!editedTemplate) return;
    await onSave({
      ...(config as Record<string, unknown>),
      template: editedTemplate,
    });
    setHasChanges(false);
  };

  const updateSection = (sectionIndex: number, updated: TemplateSection) => {
    const newSections = [...workingTemplate.sections];
    newSections[sectionIndex] = updated;
    handleTemplateChange({ ...workingTemplate, sections: newSections });
  };

  const updateFieldInSection = (
    sectionIndex: number,
    fieldId: string,
    updated: TemplateField
  ) => {
    const section = workingTemplate.sections[sectionIndex];
    const newFields = section.fields.map(f => (f.id === fieldId ? updated : f));
    updateSection(sectionIndex, { ...section, fields: newFields });
  };

  return (
    <Card className='rounded-card shadow-raised'>
      <Collapsible open={isOpen} onOpenChange={handleOpen}>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-button bg-bg-interactive'>
              <IconComponent className='size-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-base'>{template.name}</CardTitle>
              <p className='text-sm text-muted-foreground'>
                {template.description}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {isConfigurable && (
              <CollapsibleTrigger asChild>
                <Button variant='ghost' size='icon' className='size-8'>
                  <Icons.down
                    className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
            )}
            <Button
              variant='outline'
              size='sm'
              className='rounded-button text-destructive'
              onClick={onDisable}
              disabled={isSaving}
            >
              Disable
            </Button>
          </div>
        </CardHeader>

        {isConfigurable && (
          <CollapsibleContent>
            <CardContent className='space-y-3 pt-0'>
              {workingTemplate.sections.map((section, si) => (
                <div key={section.id} className='space-y-2'>
                  {section.fields
                    .filter(f => f.configurable)
                    .map(field => (
                      <ConfigurableFieldEditor
                        key={field.id}
                        field={field}
                        onChange={updated =>
                          updateFieldInSection(si, field.id, updated)
                        }
                      />
                    ))}

                  {section.configurable && (
                    <ConfigurableSectionEditor
                      section={section}
                      onChange={updated => updateSection(si, updated)}
                    />
                  )}
                </div>
              ))}

              {hasChanges && (
                <p className='text-sm text-warning'>
                  Saving changes will reset all existing responses and notify
                  members.
                </p>
              )}

              <Button
                className='w-full rounded-button'
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                isLoading={isSaving}
                loadingText='Saving...'
              >
                Save Changes
              </Button>
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  );
}

// ===== Action Button Field =====

function ActionButtonField({
  field,
  eventId,
  addonType,
}: {
  field: TemplateField;
  eventId: Id<'events'>;
  addonType: string;
}) {
  const executeFieldActions = useExecuteFieldActions();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleClick = useCallback(async () => {
    setIsExecuting(true);
    try {
      await executeFieldActions(eventId, addonType, field.id);
    } finally {
      setIsExecuting(false);
    }
  }, [executeFieldActions, eventId, addonType, field.id]);

  const variant =
    (field.buttonVariant as
      | 'default'
      | 'secondary'
      | 'outline'
      | 'destructive') ?? 'default';

  return (
    <div>
      {field.label && <Label className='mb-1'>{field.label}</Label>}
      <Button
        variant={variant}
        onClick={handleClick}
        isLoading={isExecuting}
        loadingText='Running...'
      >
        {field.buttonLabel ?? 'Action'}
      </Button>
    </div>
  );
}

// ===== Page Component =====

function FormSection({
  section,
  values,
  onChange,
  eventId,
  addonType,
  template,
}: {
  section: TemplateSection;
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  eventId: Id<'events'>;
  addonType: string;
  template: CustomAddonTemplate | null;
}) {
  return (
    <div className='space-y-3'>
      <div>
        <h3 className='font-semibold'>{section.title}</h3>
        {section.description && (
          <p className='text-sm text-muted-foreground'>{section.description}</p>
        )}
      </div>
      {section.fields.map(field => {
        // Evaluate visibility conditions
        if (!evaluateVisibilityConditions(field.visibilityConditions, values)) {
          return null;
        }

        if (isDisplayField(field.type)) {
          return (
            <div key={field.id}>
              <DisplayFieldRenderer
                field={field}
                eventId={eventId}
                addonType={addonType}
                template={template}
                fieldValues={values}
              />
            </div>
          );
        }
        return (
          <div key={field.id} className='space-y-1'>
            <Label>
              {field.label}
              {field.required && <span className='text-error'> *</span>}
            </Label>
            {renderField(field, values[field.id], v => onChange(field.id, v))}
          </div>
        );
      })}
    </div>
  );
}

function VoteField({
  field,
  eventId,
  addonType,
}: {
  field: TemplateField;
  eventId: Id<'events'>;
  addonType: string;
}) {
  const { person } = useGlobalUser();
  const personId = person?._id as Id<'persons'> | undefined;
  const addonData = useAddonData(eventId, addonType);
  const setAddonData = useSetAddonData();

  // Count votes per option
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const opt of field.options ?? []) {
      counts[opt] = 0;
    }
    for (const entry of addonData ?? []) {
      if (!entry.key.startsWith(`vote:${field.id}:`)) continue;
      const data = entry.data as { options?: string[] };
      for (const opt of data.options ?? []) {
        if (counts[opt] !== undefined) counts[opt]++;
      }
    }
    return counts;
  }, [addonData, field.id, field.options]);

  // Current user's vote
  const myVote = useMemo(() => {
    if (!personId) return null;
    const entry = (addonData ?? []).find(
      (d: { key: string }) => d.key === `vote:${field.id}:${personId}`
    );
    return (entry?.data as { options?: string[] })?.options ?? [];
  }, [addonData, field.id, personId]);

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  const handleVote = useCallback(
    async (option: string) => {
      if (!personId) return;
      let newOptions: string[];
      if (field.allowMultiple) {
        if (myVote?.includes(option)) {
          newOptions = myVote.filter(o => o !== option);
        } else {
          newOptions = [...(myVote ?? []), option];
        }
      } else {
        newOptions = myVote?.includes(option) ? [] : [option];
      }

      await setAddonData(eventId, addonType, `vote:${field.id}:${personId}`, {
        options: newOptions,
      });
    },
    [
      personId,
      field.id,
      field.allowMultiple,
      myVote,
      setAddonData,
      eventId,
      addonType,
    ]
  );

  return (
    <div className='space-y-2'>
      <Label>{field.label}</Label>
      <div className='space-y-1'>
        {field.options?.map(opt => {
          const isSelected = myVote?.includes(opt);
          const count = voteCounts[opt] ?? 0;
          const pct =
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          return (
            <button
              key={opt}
              className={`flex w-full items-center justify-between rounded-button border p-2 text-sm transition-colors ${
                isSelected
                  ? 'border-primary bg-bg-interactive'
                  : 'hover:bg-muted'
              }`}
              onClick={() => handleVote(opt)}
            >
              <span>{opt}</span>
              {(field.showResults ?? true) && (
                <span className='text-xs text-muted-foreground'>
                  {count} ({pct}%)
                </span>
              )}
            </button>
          );
        })}
      </div>
      {field.allowMultiple && (
        <p className='text-xs text-muted-foreground'>
          You can select multiple options
        </p>
      )}
    </div>
  );
}

function ListItemField({
  field,
  eventId,
  addonType,
}: {
  field: TemplateField;
  eventId: Id<'events'>;
  addonType: string;
}) {
  const { person } = useGlobalUser();
  const personId = person?._id as Id<'persons'> | undefined;
  const addonData = useAddonData(eventId, addonType);
  const setAddonData = useSetAddonData();

  // Aggregate claims per item
  const claimsByItem = useMemo(() => {
    const claims: Record<string, { total: number; mine: number }> = {};
    for (const item of field.items ?? []) {
      claims[item.id] = { total: 0, mine: 0 };
    }
    for (const entry of addonData ?? []) {
      if (!entry.key.startsWith('claims:')) continue;
      const data = entry.data as Record<string, number>;
      const isMe = entry.createdBy === personId;
      for (const [itemId, qty] of Object.entries(data)) {
        if (claims[itemId]) {
          claims[itemId].total += qty;
          if (isMe) claims[itemId].mine += qty;
        }
      }
    }
    return claims;
  }, [addonData, field.items, personId]);

  const handleClaim = useCallback(
    async (itemId: string, claim: boolean) => {
      if (!personId) return;

      // Get current user's claims
      const existingEntry = (addonData ?? []).find(
        (d: { key: string; createdBy?: string }) =>
          d.key === `claims:${personId}` && d.createdBy === personId
      );
      const existingClaims =
        (existingEntry?.data as Record<string, number>) ?? {};

      const newClaims = { ...existingClaims };
      if (claim) {
        newClaims[itemId] = (newClaims[itemId] ?? 0) + 1;
      } else {
        const current = newClaims[itemId] ?? 0;
        if (current <= 1) {
          delete newClaims[itemId];
        } else {
          newClaims[itemId] = current - 1;
        }
      }

      await setAddonData(eventId, addonType, `claims:${personId}`, newClaims);
    },
    [personId, addonData, setAddonData, eventId, addonType]
  );

  return (
    <div className='space-y-2'>
      <Label>{field.label}</Label>
      <div className='space-y-1'>
        {field.items?.map(item => {
          const claims = claimsByItem[item.id] ?? { total: 0, mine: 0 };
          const isFull = item.quantity - claims.total <= 0;

          return (
            <div
              key={item.id}
              className='flex items-center justify-between rounded-card border p-2'
            >
              <div>
                <p className='text-sm font-medium'>{item.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {claims.total}/{item.quantity} claimed
                  {claims.mine > 0 && ` (${claims.mine} by you)`}
                </p>
              </div>
              <div className='flex items-center gap-1'>
                {claims.mine > 0 && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 rounded-button text-xs'
                    onClick={() => handleClaim(item.id, false)}
                  >
                    -
                  </Button>
                )}
                {!isFull && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 rounded-button text-xs'
                    onClick={() => handleClaim(item.id, true)}
                  >
                    +
                  </Button>
                )}
                {isFull && claims.mine === 0 && (
                  <Badge variant='secondary' className='rounded-badge text-xs'>
                    Full
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleField({
  field,
  eventId,
  addonType,
}: {
  field: TemplateField;
  eventId: Id<'events'>;
  addonType: string;
}) {
  const { person } = useGlobalUser();
  const personId = person?._id as Id<'persons'> | undefined;
  const addonData = useAddonData(eventId, addonType);
  const setAddonData = useSetAddonData();

  // Read current state from addonData key `toggle:{fieldId}:{personId}`
  const isEnabled = useMemo(() => {
    if (!personId) return field.defaultEnabled ?? true;
    const entry = (addonData ?? []).find(
      (d: { key: string }) => d.key === `toggle:${field.id}:${personId}`
    );
    if (!entry) return field.defaultEnabled ?? true;
    const data = entry.data as { enabled?: boolean };
    return data.enabled ?? field.defaultEnabled ?? true;
  }, [addonData, field.id, field.defaultEnabled, personId]);

  const handleChange = useCallback(
    async (checked: boolean) => {
      if (!personId) return;
      await setAddonData(eventId, addonType, `toggle:${field.id}:${personId}`, {
        enabled: checked,
      });
    },
    [personId, field.id, setAddonData, eventId, addonType]
  );

  return (
    <div className='flex items-center gap-2'>
      <Switch checked={isEnabled} onCheckedChange={handleChange} />
      <span className='text-sm'>{field.label}</span>
    </div>
  );
}

/**
 * Build a field values map from addon data for visibility condition evaluation
 * in interactive sections.
 */
function buildFieldsFromAddonData(
  addonData: Array<{ key: string; data: unknown }> | undefined,
  personId: string | undefined
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (!addonData || !personId) return fields;

  for (const entry of addonData) {
    // response:{personId} → spread all fields
    if (entry.key === `response:${personId}`) {
      const data = entry.data as Record<string, unknown> | undefined;
      if (data && typeof data === 'object') {
        Object.assign(fields, data);
      }
    }
    // toggle:{fieldId}:{personId} → fields[fieldId] = enabled
    const toggleMatch: RegExpMatchArray | null =
      entry.key.match(/^toggle:(.+):(.+)$/);
    if (toggleMatch && toggleMatch[2] === personId) {
      const data = entry.data as { enabled?: boolean } | undefined;
      fields[toggleMatch[1]] = data?.enabled ?? false;
    }
    // vote:{fieldId}:{personId} → fields[fieldId] = options
    const voteMatch: RegExpMatchArray | null =
      entry.key.match(/^vote:(.+):(.+)$/);
    if (voteMatch && voteMatch[2] === personId) {
      const data = entry.data as { options?: string[] } | undefined;
      fields[voteMatch[1]] = data?.options ?? [];
    }
  }

  return fields;
}

/** Render a single interactive field in its own card */
function StandaloneInteractiveField({
  field,
  eventId,
  addonType,
  template,
  fieldValues,
}: {
  field: TemplateField;
  eventId: Id<'events'>;
  addonType: string;
  template: CustomAddonTemplate | null;
  fieldValues?: Record<string, unknown>;
}) {
  switch (field.type) {
    case 'vote':
      return (
        <Card className='rounded-card shadow-raised'>
          <CardContent className='p-4'>
            <VoteField field={field} eventId={eventId} addonType={addonType} />
          </CardContent>
        </Card>
      );
    case 'list_item':
      return (
        <Card className='rounded-card shadow-raised'>
          <CardContent className='p-4'>
            <ListItemField
              field={field}
              eventId={eventId}
              addonType={addonType}
            />
          </CardContent>
        </Card>
      );
    case 'toggle':
      return (
        <Card className='w-fit rounded-card shadow-raised'>
          <CardContent className='p-4'>
            <ToggleField
              field={field}
              eventId={eventId}
              addonType={addonType}
            />
          </CardContent>
        </Card>
      );
    case 'action_button':
      return (
        <ActionButtonField
          field={field}
          eventId={eventId}
          addonType={addonType}
        />
      );
    default:
      // Display fields (static_text, dynamic_summary, divider, info_callout)
      if (isDisplayField(field.type)) {
        // Static text and dividers render without a card wrapper
        if (field.type === 'static_text' || field.type === 'divider') {
          return (
            <DisplayFieldRenderer
              field={field}
              eventId={eventId}
              addonType={addonType}
              template={template}
              fieldValues={fieldValues}
            />
          );
        }
        return (
          <Card className='rounded-card shadow-raised'>
            <CardContent className='p-4'>
              <DisplayFieldRenderer
                field={field}
                eventId={eventId}
                addonType={addonType}
                template={template}
                fieldValues={fieldValues}
              />
            </CardContent>
          </Card>
        );
      }
      return null;
  }
}

export function CustomAddonPageComponent({
  eventId,
  config,
  addonType,
}: AddonPageProps & { addonType: string }) {
  const template = getTemplate(config);
  const { person } = useGlobalUser();
  const personId = person?._id as Id<'persons'> | undefined;
  const myData = useMyAddonData(eventId, addonType ?? '');
  const addonData = useAddonData(eventId, addonType ?? '');
  const setAddonData = useSetAddonData();

  // Find existing form response
  const existingResponse = useMemo(() => {
    const entry = (myData ?? []).find(
      (d: { key: string }) => d.key === `response:${personId}`
    );
    return (entry?.data as Record<string, unknown>) ?? {};
  }, [myData, personId]);

  const [formValues, setFormValues] =
    useState<Record<string, unknown>>(existingResponse);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when existing response loads
  const hasLoaded = myData !== undefined;
  const [initialized, setInitialized] = useState(false);
  if (hasLoaded && !initialized && Object.keys(existingResponse).length > 0) {
    setFormValues(existingResponse);
    setInitialized(true);
  }

  // Build field values from addon data for interactive section visibility
  const interactiveFieldValues = useMemo(
    () => buildFieldsFromAddonData(addonData ?? undefined, personId),
    [addonData, personId]
  );

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!personId || !addonType || !template) return;
    setIsSaving(true);
    try {
      // Only submit values for visible fields in visible sections
      const visibleValues: Record<string, unknown> = {};
      for (const section of template.sections) {
        if (section.layout === 'interactive') continue;
        // Skip hidden sections entirely
        if (
          !evaluateVisibilityConditions(
            section.visibilityConditions,
            formValues
          )
        )
          continue;
        for (const field of section.fields) {
          if (isDisplayField(field.type)) continue;
          if (
            evaluateVisibilityConditions(field.visibilityConditions, formValues)
          ) {
            visibleValues[field.id] = formValues[field.id];
          }
        }
      }

      await setAddonData(
        eventId,
        addonType,
        `response:${personId}`,
        visibleValues
      );
    } finally {
      setIsSaving(false);
    }
  }, [personId, addonType, eventId, setAddonData, formValues, template]);

  if (!template) {
    return <p className='text-muted-foreground'>Add-on not found.</p>;
  }

  // Check if any form-layout section has actual input fields (need a submit button)
  const hasFormInputs = template.sections.some(s => {
    if (s.layout === 'interactive') return false;
    return s.fields.some(f => !isDisplayField(f.type));
  });

  return (
    <div className='space-y-6'>
      {template.sections.map(section => {
        const layout = section.layout ?? 'form';

        // Evaluate section-level visibility conditions
        const sectionValues =
          layout === 'interactive' ? interactiveFieldValues : formValues;
        if (
          !evaluateVisibilityConditions(
            section.visibilityConditions,
            sectionValues
          )
        ) {
          return null;
        }

        if (layout === 'interactive') {
          // Interactive section: each field renders standalone
          return section.fields.map(field => {
            // Evaluate visibility for interactive fields
            if (
              !evaluateVisibilityConditions(
                field.visibilityConditions,
                interactiveFieldValues
              )
            ) {
              return null;
            }
            return (
              <StandaloneInteractiveField
                key={field.id}
                field={field}
                eventId={eventId}
                addonType={addonType ?? ''}
                template={template}
                fieldValues={interactiveFieldValues}
              />
            );
          });
        }

        // Form section: all fields in a single card
        if (section.fields.length === 0) return null;

        return (
          <Card key={section.id} className='rounded-card shadow-raised'>
            <CardContent className='space-y-4 p-4'>
              <FormSection
                section={section}
                values={formValues}
                onChange={handleFieldChange}
                eventId={eventId}
                addonType={addonType ?? ''}
                template={template}
              />
            </CardContent>
          </Card>
        );
      })}

      {/* Submit button at bottom if any form section has input fields */}
      {hasFormInputs && (
        <Button
          className='w-full rounded-button'
          onClick={handleSubmit}
          isLoading={isSaving}
          loadingText='Saving...'
        >
          {Object.keys(existingResponse).length > 0
            ? template.submitButtonLabel || 'Update Response'
            : template.submitButtonLabel || 'Submit Response'}
        </Button>
      )}
    </div>
  );
}
