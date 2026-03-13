'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  isDisplayField,
  type CustomAddonTemplate,
} from '@/lib/custom-addon-schema';
import { AddonHeader, SettingsBadges, PreviewWrapper } from './preview-utils';
import { PreviewField, PreviewSection } from './preview-field';
import type { TemplateField } from '@/lib/custom-addon-schema';

/**
 * Generate a mock number value that respects the field's min/max constraints.
 * Uses a deterministic spread across 3 mock rows.
 */
function mockNumber(field: TemplateField, rowIndex: number): string {
  const min = field.min ?? 0;
  const max = field.max ?? 100;

  if (min === max) return String(min);

  // Spread 3 values evenly within [min, max]
  const fractions = [0.7, 0.15, 0.4];
  const raw = min + (max - min) * fractions[rowIndex];
  // Use integers if both bounds are integers, otherwise 1 decimal
  const isInteger =
    (field.min === undefined || Number.isInteger(field.min)) &&
    (field.max === undefined || Number.isInteger(field.max));
  return isInteger ? String(Math.round(raw)) : raw.toFixed(1);
}

export function OrganizerPagePreview({
  template,
}: {
  template: CustomAddonTemplate;
}) {
  // Check if any form-layout section has actual input fields (need a submit button)
  const hasFormInputs = template.sections.some(s => {
    if (s.layout === 'interactive') return false;
    return s.fields.some(f => !isDisplayField(f.type));
  });

  // Collect input field labels for mock response table (only from form sections)
  const inputFields = template.sections
    .filter(s => (s.layout ?? 'form') === 'form')
    .flatMap(s => s.fields.filter(f => !isDisplayField(f.type)));

  return (
    <PreviewWrapper label='Event page — organizer view'>
      <div className='space-y-4'>
        <AddonHeader template={template} />

        {template.sections.map(section => {
          if (section.layout === 'interactive') {
            // Interactive section: each field standalone
            return section.fields.map(field => {
              if (
                field.type === 'action_button' ||
                field.type === 'static_text'
              ) {
                return (
                  <PreviewField
                    key={field.id}
                    field={field}
                    templateName={template.name}
                  />
                );
              }

              const showLabel =
                field.label &&
                !isDisplayField(field.type) &&
                field.type !== 'toggle';

              return (
                <Card
                  key={field.id}
                  className={`rounded-card shadow-raised ${field.type === 'toggle' ? 'w-fit' : ''}`}
                >
                  <CardContent className='space-y-1 p-4'>
                    {showLabel && (
                      <Label className='text-sm font-medium'>
                        {field.label}
                      </Label>
                    )}
                    <PreviewField field={field} templateName={template.name} />
                  </CardContent>
                </Card>
              );
            });
          }

          // Form section: all fields in a single card
          if (section.fields.length === 0) return null;

          return (
            <Card key={section.id} className='rounded-card shadow-raised'>
              <CardContent className='space-y-4 p-4'>
                <PreviewSection
                  section={section}
                  templateName={template.name}
                />
              </CardContent>
            </Card>
          );
        })}

        {hasFormInputs && (
          <Button className='w-full rounded-button' disabled>
            {template.submitButtonLabel || 'Submit Response'}
          </Button>
        )}

        {/* Organizer-only: Export button + mock response table */}
        <Card className='rounded-card shadow-raised'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-base'>Responses</CardTitle>
            <Button
              variant='outline'
              size='sm'
              className='rounded-button'
              disabled
            >
              <Icons.download className='mr-1 size-3' />
              Export
            </Button>
          </CardHeader>
          <CardContent className='p-4 pt-0'>
            {inputFields.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='pb-2 pr-4 text-left font-medium text-muted-foreground'>
                        Member
                      </th>
                      {inputFields.slice(0, 3).map(f => (
                        <th
                          key={f.id}
                          className='pb-2 pr-4 text-left font-medium text-muted-foreground'
                        >
                          {f.label || 'Field'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='text-muted-foreground'>
                    <tr className='border-b'>
                      <td className='py-2 pr-4'>Alice</td>
                      {inputFields.slice(0, 3).map(f => (
                        <td key={f.id} className='py-2 pr-4'>
                          {f.type === 'yesno'
                            ? 'Yes'
                            : f.type === 'number'
                              ? mockNumber(f, 0)
                              : 'Sample'}
                        </td>
                      ))}
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 pr-4'>Bob</td>
                      {inputFields.slice(0, 3).map(f => (
                        <td key={f.id} className='py-2 pr-4'>
                          {f.type === 'yesno'
                            ? 'No'
                            : f.type === 'number'
                              ? mockNumber(f, 1)
                              : 'Answer'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className='py-2 pr-4'>Charlie</td>
                      {inputFields.slice(0, 3).map(f => (
                        <td key={f.id} className='py-2 pr-4'>
                          {f.type === 'yesno'
                            ? 'Yes'
                            : f.type === 'number'
                              ? mockNumber(f, 2)
                              : 'Response'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>
                No form fields to show responses for.
              </p>
            )}
          </CardContent>
        </Card>

        <SettingsBadges template={template} />
      </div>
    </PreviewWrapper>
  );
}
