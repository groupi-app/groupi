import { createRoot } from 'react-dom/client';
import { BuilderPage } from '@/features/addons/authoring';
import { trackNavigationHistory } from '@/lib/navigation-history';
import {
  createEmptyTemplate,
  type CustomAddonTemplate,
} from '@/features/addons/schema';
import type { Id } from '@/convex/_generated/dataModel';

const initial: CustomAddonTemplate = {
  name: 'Neighbourhood supper and community storytelling evening',
  description:
    'Plan an evening together and make room for everyone around the table.',
  iconName: 'listChecks',
  sections: [
    {
      id: 'food',
      title: 'Food and drinks to share around the community table',
      fields: [
        {
          id: 'dish',
          type: 'text',
          label: 'What are you bringing to share with everyone?',
          required: true,
          variant: 'long',
        },
      ],
    },
    {
      id: 'dietary',
      title:
        'Dietary preferences, accessibility and anything else we should know',
      fields: [
        {
          id: 'diet',
          type: 'multiselect',
          label: 'Which food options would make you feel welcome?',
          required: false,
          options: [
            'A vegetarian main dish with a clear list of ingredients',
            'Something suitable for guests who avoid gluten or dairy',
          ],
        },
      ],
    },
    {
      id: 'help',
      title: 'Helping with the evening',
      fields: [
        {
          id: 'helping',
          type: 'yesno',
          label: 'Can you help set the table?',
          required: false,
        },
      ],
    },
  ],
};
trackNavigationHistory();
const empty = new URLSearchParams(window.location.search).has('empty');
createRoot(document.getElementById('root')!).render(
  <BuilderPage
    templateId={empty ? undefined : ('template-one' as Id<'addonTemplates'>)}
    initialTemplate={empty ? createEmptyTemplate() : initial}
  />
);
