'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  isDisplayField,
  SUMMARY_TYPE_LABELS,
  type TemplateField,
  type TemplateSection,
  type CalloutVariant,
} from '@/lib/custom-addon-schema';
import { interpolateVariables, mockSummaryValue } from './preview-utils';

// ===== Display field renderers =====

function PreviewDisplayField({
  field,
  templateName,
}: {
  field: TemplateField;
  templateName?: string;
}) {
  switch (field.type) {
    case 'action_button':
      return (
        <Button
          variant={
            (field.buttonVariant as
              | 'default'
              | 'secondary'
              | 'outline'
              | 'destructive') ?? 'default'
          }
          disabled
        >
          {field.buttonLabel || 'Click Me'}
        </Button>
      );

    case 'static_text': {
      const text = field.content
        ? interpolateVariables(field.content, templateName)
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

    case 'dynamic_summary': {
      const summaryType = field.summaryType ?? 'response_count';
      const label =
        field.summaryLabel || SUMMARY_TYPE_LABELS[summaryType] || 'Summary';
      return (
        <div className='flex items-center justify-between rounded-card border bg-muted/50 p-3'>
          <span className='text-sm text-muted-foreground'>{label}</span>
          <span className='text-sm font-bold'>
            {mockSummaryValue(summaryType)}
          </span>
        </div>
      );
    }

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
      const variant = field.calloutVariant ?? 'info';
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
              ? interpolateVariables(field.calloutMessage, templateName)
              : 'No message set'}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}

// ===== Mock input field renderers (non-interactive, shows shape only) =====

export function PreviewField({
  field,
  templateName,
}: {
  field: TemplateField;
  templateName?: string;
}) {
  const hasConditions = (field.visibilityConditions?.length ?? 0) > 0;

  // Display fields use their own renderer
  if (isDisplayField(field.type)) {
    return (
      <>
        <PreviewDisplayField field={field} templateName={templateName} />
        {hasConditions && (
          <p className='text-[10px] text-muted-foreground'>
            Conditionally visible
          </p>
        )}
      </>
    );
  }

  const rendered = (() => {
    switch (field.type) {
      case 'text':
        return field.variant === 'long' ? (
          <Textarea
            placeholder={field.placeholder || 'Type your answer...'}
            rows={3}
            className='resize-none rounded-input'
            readOnly
          />
        ) : (
          <Input
            placeholder={field.placeholder || 'Type your answer...'}
            className='rounded-input'
            readOnly
          />
        );

      case 'number':
        return (
          <Input
            type='number'
            placeholder={
              field.min !== undefined && field.max !== undefined
                ? `${field.min} – ${field.max}`
                : 'Enter a number...'
            }
            className='rounded-input'
            readOnly
          />
        );

      case 'select':
        if (
          field.configurable &&
          (!field.options || field.options.length === 0)
        ) {
          return (
            <p className='rounded-card border border-dashed p-3 text-center text-xs italic text-muted-foreground'>
              Options set by organizer
            </p>
          );
        }
        return (
          <Select disabled>
            <SelectTrigger className='rounded-input'>
              <SelectValue placeholder='Select an option...' />
            </SelectTrigger>
            <SelectContent className='rounded-dropdown'>
              {field.options?.map((opt, i) => (
                <SelectItem key={i} value={opt || `__empty_${i}`}>
                  {opt || `Option ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        if (
          field.configurable &&
          (!field.options || field.options.length === 0)
        ) {
          return (
            <p className='rounded-card border border-dashed p-3 text-center text-xs italic text-muted-foreground'>
              Options set by organizer
            </p>
          );
        }
        return (
          <div className='space-y-1.5'>
            {field.options?.map((opt, i) => (
              <label key={i} className='flex items-center gap-2 text-sm'>
                <Checkbox disabled />
                {opt || `Option ${i + 1}`}
              </label>
            ))}
          </div>
        );

      case 'yesno':
        return (
          <div className='flex items-center gap-2'>
            <Switch disabled />
            <span className='text-sm text-muted-foreground'>No</span>
          </div>
        );

      case 'toggle':
        return (
          <div className='flex items-center gap-2'>
            <Switch checked={field.defaultEnabled ?? true} disabled />
            <span className='text-sm'>{field.label}</span>
          </div>
        );

      case 'vote':
        if (
          field.configurable &&
          (!field.options || field.options.length === 0)
        ) {
          return (
            <p className='rounded-card border border-dashed p-3 text-center text-xs italic text-muted-foreground'>
              Options set by organizer
            </p>
          );
        }
        return (
          <div className='space-y-1.5'>
            {field.options?.map((opt, i) => (
              <button
                key={i}
                disabled
                className={`flex w-full items-center justify-between rounded-button border p-2.5 text-sm ${
                  i === 0 ? 'border-primary bg-bg-interactive' : 'bg-card'
                }`}
              >
                <span>{opt || `Option ${i + 1}`}</span>
                {(field.showResults ?? true) && (
                  <span className='text-xs text-muted-foreground'>
                    {i === 0 ? '3 (60%)' : i === 1 ? '2 (40%)' : '0 (0%)'}
                  </span>
                )}
              </button>
            ))}
            {field.allowMultiple && (
              <p className='text-xs text-muted-foreground'>
                You can select multiple options
              </p>
            )}
          </div>
        );

      case 'list_item':
        if (field.configurable && (!field.items || field.items.length === 0)) {
          return (
            <p className='rounded-card border border-dashed p-3 text-center text-xs italic text-muted-foreground'>
              Items set by organizer
            </p>
          );
        }
        return (
          <div className='space-y-1.5'>
            {field.items?.map(item => (
              <div
                key={item.id}
                className='flex items-center justify-between rounded-card border p-2.5'
              >
                <div>
                  <p className='text-sm font-medium'>
                    {item.name || 'Unnamed item'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    1/{item.quantity} claimed (1 by you)
                  </p>
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 rounded-button text-xs'
                    disabled
                  >
                    -
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 rounded-button text-xs'
                    disabled
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  })();

  return (
    <>
      {rendered}
      {hasConditions && (
        <p className='text-[10px] text-muted-foreground'>
          Conditionally visible
        </p>
      )}
    </>
  );
}

// ===== Section renderers =====

export function PreviewSection({
  section,
  templateName,
}: {
  section: TemplateSection;
  templateName?: string;
}) {
  // Configurable section with no fields — show placeholder
  if (section.configurable && section.fields.length === 0) {
    return (
      <div className='space-y-3'>
        {(section.title || section.description) && (
          <div>
            {section.title && (
              <h3 className='font-semibold'>{section.title}</h3>
            )}
            {section.description && (
              <p className='text-sm text-muted-foreground'>
                {section.description}
              </p>
            )}
          </div>
        )}
        <p className='rounded-card border border-dashed p-3 text-center text-xs italic text-muted-foreground'>
          Fields added by organizer
        </p>
      </div>
    );
  }

  // Interactive layout: render all fields standalone (no form grouping)
  if (section.layout === 'interactive') {
    return (
      <>
        {section.fields.map(field => (
          <div key={field.id} className='space-y-1'>
            {field.label &&
              !isDisplayField(field.type) &&
              field.type !== 'toggle' && (
                <Label className='text-sm font-medium'>{field.label}</Label>
              )}
            <PreviewField field={field} templateName={templateName} />
          </div>
        ))}
      </>
    );
  }

  // Form layout (default): all fields grouped together
  return (
    <div className='space-y-3'>
      {(section.title || section.description) && (
        <div>
          {section.title && <h3 className='font-semibold'>{section.title}</h3>}
          {section.description && (
            <p className='text-sm text-muted-foreground'>
              {section.description}
            </p>
          )}
        </div>
      )}
      {section.fields.map(field => {
        const display = isDisplayField(field.type);
        return (
          <div key={field.id} className='space-y-1'>
            {!display && field.label && (
              <Label>
                {field.label}
                {field.required && <span className='text-error'> *</span>}
              </Label>
            )}
            <PreviewField field={field} templateName={templateName} />
          </div>
        );
      })}
    </div>
  );
}
