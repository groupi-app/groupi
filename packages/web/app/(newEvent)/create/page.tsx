'use client';

import { CreateWizard } from './components/create-wizard';
import { NewEventFormBlank } from './components/new-event-form-blank';
import { FormPageTemplate } from '@/components/templates';

/**
 * New Event Page - Client-only architecture
 * - Authentication handled at layout level
 * - Real-time event creation with Convex mutations
 */
export default function Page() {
  return (
    <FormPageTemplate title='New Event' skeleton={<NewEventFormBlank />}>
      <CreateWizard />
    </FormPageTemplate>
  );
}
