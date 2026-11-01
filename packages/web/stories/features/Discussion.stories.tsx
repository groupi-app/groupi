import { TooltipProvider } from '@/components/ui/tooltip';
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState, type ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { DiscussionComposer } from '@/features/discussion/composer';
import { DiscussionContent } from '@/features/discussion/content';
import { AttachmentGallery } from '@/components/attachments';

/** No preview mutation is sent to an application backend or storage service. */
function PreviewClient({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const value = new ConvexReactClient(
      'https://preview-fixture.convex.cloud',
      { unsavedChangesWarning: false }
    );
    value.mutation = async () => {
      throw new Error(
        'File uploads are disabled in this isolated preview. Text drafts can be submitted locally.'
      );
    };
    return value;
  });
  useEffect(
    () => () => {
      void client.close();
    },
    [client]
  );
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
const members = [
  {
    personId: 'preview-person' as Id<'persons'>,
    name: 'Alex Rivera',
    username: 'alex',
  },
];
const content =
  '<h2>Our next community picnic</h2><p>Bring your ideas, <span class="mention" data-id="preview-person">@alex</span>.</p><ul><li><strong>Meet at noon</strong></li><li>Share a dish and a story</li></ul><blockquote>Everyone is welcome.</blockquote>';
const meta: Meta = {
  decorators: [
    Story => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  title: 'Features/Shared discussion',
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const RichContent: Story = {
  render: () => (
    <main className='mx-auto max-w-3xl space-y-6 p-6'>
      <h1 className='font-heading text-3xl font-bold'>Community picnic</h1>
      <p className='text-sm text-muted-foreground'>Alex Rivera · Group post</p>
      <DiscussionContent content={content} members={members} />
      <AttachmentGallery
        attachments={[
          {
            _id: 'preview-document',
            type: 'FILE',
            filename: 'picnic-plan.pdf',
            size: 24000,
            mimeType: 'application/pdf',
            url: null,
          },
        ]}
      />
    </main>
  ),
};
function ComposerPreview() {
  const [saved, setSaved] = useState(false);
  return (
    <PreviewClient>
      <main className='mx-auto max-w-3xl space-y-6 p-6'>
        <h1 className='font-heading text-3xl font-bold'>New Group post</h1>
        <p className='text-sm text-muted-foreground'>
          An isolated draft with local save feedback. No application data is
          written.
        </p>
        <DiscussionComposer
          initialTitle='Community picnic'
          initialContent={content}
          mentionMembers={members}
          submitLabel='Publish post'
          onSave={async () => setSaved(true)}
          onCancel={() => setSaved(false)}
        />
        {saved && <p role='status'>Draft submitted locally.</p>}
      </main>
    </PreviewClient>
  );
}
export const RichComposer: Story = { render: () => <ComposerPreview /> };
export const NarrowComposer: Story = {
  ...RichComposer,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
