'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBuilder } from './builder-context';
import { EmptyPreview } from './preview/preview-utils';
import { EventCardPreview } from './preview/preview-event-card';
import { AttendeePagePreview } from './preview/preview-attendee-page';
import { OrganizerPagePreview } from './preview/preview-organizer-page';
import { ManageCardPreview } from './preview/preview-manage-card';

export function PreviewPanel() {
  const { template } = useBuilder();

  const hasContent = template.sections.some(
    s => s.fields.length > 0 || s.configurable
  );
  const hasConfigurable = template.sections.some(
    s => s.configurable || s.fields.some(f => f.configurable)
  );

  if (!hasContent && !hasConfigurable) {
    return (
      <div className='p-4'>
        <EmptyPreview />
      </div>
    );
  }

  return (
    <div className='space-y-4 p-4'>
      <Tabs defaultValue='addon-page' className='space-y-3'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='config-card' className='text-xs'>
            Config
          </TabsTrigger>
          <TabsTrigger value='event-card' className='text-xs'>
            Event
          </TabsTrigger>
          <TabsTrigger value='addon-page' className='text-xs'>
            Page
          </TabsTrigger>
          <TabsTrigger value='organizer' className='text-xs'>
            Organizer
          </TabsTrigger>
        </TabsList>

        <TabsContent value='config-card'>
          <ManageCardPreview template={template} />
        </TabsContent>

        <TabsContent value='event-card'>
          <EventCardPreview template={template} />
        </TabsContent>

        <TabsContent value='addon-page'>
          <AttendeePagePreview template={template} />
        </TabsContent>

        <TabsContent value='organizer'>
          <OrganizerPagePreview template={template} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
