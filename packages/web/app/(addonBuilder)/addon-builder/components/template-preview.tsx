'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBuilder } from './builder-context';
import { EmptyPreview } from './preview/preview-utils';
import { EventCardPreview } from './preview/preview-event-card';
import { AttendeePagePreview } from './preview/preview-attendee-page';
import { OrganizerPagePreview } from './preview/preview-organizer-page';
import { ManageCardPreview } from './preview/preview-manage-card';

export function TemplatePreview() {
  const { template } = useBuilder();

  const hasFields = template.sections.some(s => s.fields.length > 0);

  if (!hasFields) {
    return <EmptyPreview />;
  }

  return (
    <Tabs defaultValue='addon-page' className='space-y-4'>
      <TabsList className='grid w-full grid-cols-4'>
        <TabsTrigger value='config-card' className='text-xs'>
          Config Card
        </TabsTrigger>
        <TabsTrigger value='event-card' className='text-xs'>
          Event Card
        </TabsTrigger>
        <TabsTrigger value='addon-page' className='text-xs'>
          Addon Page
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
  );
}
