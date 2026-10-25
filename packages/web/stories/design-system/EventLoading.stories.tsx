import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EventLogisticsPreviewSkeleton } from '@/components/organisms/event-logistics-preview';
import { EventPageSkeleton } from '@/components/skeletons/event-page-skeleton';
import { DetailPageTemplate } from '@/components/templates/detail-page-template';
import {
  EventHeaderLayout,
  EventTitle,
} from '@/components/templates/event-header-layout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StickerIcon } from '@/components/atoms/sticker-icon';
import { Icons } from '@/components/icons';

const meta = {
  title: 'Design system/Event loading',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Source-only fixtures use the same production page/header shells. There is no
 * backend client, private event data, navigation or mutation in this story. */
function EventLoadingFixture() {
  const [state, setState] = useState<'loading' | 'short' | 'long'>('loading');
  const long = state === 'long';
  const title = long
    ? 'A very long neighborhood gathering for board games, shared stories and SupercalifragilisticexpialidociousPlanning'
    : 'Game night';
  return (
    <>
      <aside aria-label='Fixture controls' className='flex flex-wrap gap-2 p-4'>
        <Button variant='outline' onClick={() => setState('loading')}>
          Show loading
        </Button>
        <Button variant='outline' onClick={() => setState('short')}>
          Load short event
        </Button>
        <Button variant='outline' onClick={() => setState('long')}>
          Load long event
        </Button>
      </aside>
      <section aria-label='Event content preview'>
        {state === 'loading' ? (
          <EventPageSkeleton />
        ) : (
          <DetailPageTemplate
            header={
              <EventHeaderLayout
                title={<EventTitle>{title}</EventTitle>}
                actions={
                  <Button
                    disabled
                    variant='ghost'
                    size='icon'
                    className='size-12'
                    aria-label='Event options'
                  >
                    <Icons.more aria-hidden className='size-8' />
                  </Button>
                }
                metadata={
                  <>
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <StickerIcon icon={Icons.date} size='sm' color='info' />
                      <span className='min-w-0 break-words font-semibold'>
                        Sunday, November 15, 2026 at 6:00 PM
                      </span>
                    </div>
                    <div className='flex items-center gap-2.5'>
                      <Icons.lock className='size-4 shrink-0 text-muted-foreground/70' />
                      <span className='text-sm text-muted-foreground/70'>
                        Private event
                      </span>
                    </div>
                  </>
                }
                description={
                  long ? (
                    <p>
                      A relaxed evening with neighbors. Bring your favorite game
                      and a story to share; all of this content is local fixture
                      text so a slow connection never reveals a previous event.
                    </p>
                  ) : undefined
                }
              />
            }
          >
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-heading font-medium'>Attendees</h2>
                <span className='rounded-full p-[.3rem] text-xs bg-muted text-muted-foreground'>
                  2
                </span>
              </div>
              <div className='flex items-center p-2 -space-x-2 h-[54px] overflow-hidden'>
                <Avatar className='size-10'>
                  <AvatarFallback>AX</AvatarFallback>
                </Avatar>
                <Avatar className='size-10'>
                  <AvatarFallback>SY</AvatarFallback>
                </Avatar>
              </div>
              <span className='text-primary'>View All</span>
            </div>
            <div>
              <h2 className='text-xl font-heading font-medium'>Posts</h2>
              <div className='flex flex-col gap-3 py-2'>
                {[0, 1, 2].map(index => (
                  <Card key={index} edge='none' className='relative w-full'>
                    <Avatar className='absolute top-4 left-3 size-10'>
                      <AvatarFallback>AX</AvatarFallback>
                    </Avatar>
                    <div className='w-full pt-4 px-5 pb-2'>
                      <div className='flex flex-col gap-1'>
                        <div className='ml-12 mb-2 flex min-w-0 flex-col pr-12'>
                          <span className='truncate sm:text-xl font-heading'>
                            {long
                              ? 'Plans, travel details and a longer conversation'
                              : 'See you there'}
                          </span>
                          <span className='text-sm text-muted-foreground'>
                            Alex Example
                          </span>
                        </div>
                        <p className='text-sm'>
                          {long
                            ? 'We will meet near the main entrance before heading inside together. There is room for everyone, and we can decide which game to play after we arrive.'
                            : 'Looking forward to game night.'}
                        </p>
                        <div className='flex items-center justify-between gap-2 mt-2 text-sm text-muted-foreground'>
                          <span>Created today</span>
                          <span>0 replies</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </DetailPageTemplate>
        )}
      </section>
    </>
  );
}
export const LoadingToContent: Story = {
  render: () => <EventLoadingFixture />,
};

export const LogisticsPreviewLoading: Story = {
  render: () => <EventLogisticsPreviewSkeleton />,
};
