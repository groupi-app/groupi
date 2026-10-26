import type { Meta, StoryObj } from '@storybook/react';
import { NewContentMenu } from '@/features/content/new-content-menu';
import { ContentNavigation } from '@/features/content/content-navigation';

const meta: Meta<typeof NewContentMenu> = {
  title: 'Features/Content creation',
  component: NewContentMenu,
  parameters: { layout: 'fullscreen' },
  args: {
    context: 'event',
    basePath: '/event/fixture',
    allowed: { post: true, form: true, list: true, poll: true },
  },
  render: args => (
    <main className='mx-auto flex max-w-4xl flex-col gap-6 p-6'>
      <header className='flex items-center justify-between gap-4'>
        <h1 className='font-heading text-3xl font-bold'>Community picnic</h1>
        <NewContentMenu {...args} />
      </header>
      <ContentNavigation basePath={args.basePath} context={args.context} />
      <p className='text-muted-foreground'>
        Share an update, collect answers, keep a list, or vote together.
      </p>
    </main>
  ),
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Event: Story = {};
export const GroupPolicies: Story = {
  args: {
    context: 'group',
    basePath: '/groups/fixture',
    allowed: { post: true, form: false, list: true, poll: false },
  },
};
