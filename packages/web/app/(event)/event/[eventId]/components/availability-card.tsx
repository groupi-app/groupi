'use client';

import { cn, getInitialsFromName } from '@/lib/utils';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Doc } from '../../../../../../../convex/_generated/dataModel';
import { User } from '@/convex/types';

// Match the actual Convex query return type structure
type PotentialDateTime = Doc<'potentialDateTimes'> & {
  availabilities: Array<
    Doc<'availabilities'> & {
      member: Doc<'memberships'> & {
        person:
          | (Doc<'persons'> & {
              user: User;
            })
          | null;
      };
    }
  >;
};

export function AvailabilityCard({
  pdt,
  formAnswers,
  setFormAnswer,
  setFormNote,
  index,
}: {
  pdt: PotentialDateTime;
  formAnswers: Array<{
    potentialDateTimeId: string;
    answer: 'yes' | 'maybe' | 'no';
    note?: string;
  }>;
  setFormAnswer: (
    index: number,
    value: {
      potentialDateTimeId: string;
      answer: 'yes' | 'maybe' | 'no';
      note?: string;
    }
  ) => void;
  setFormNote: (index: number, note: string) => void;
  index: number;
}) {
  const [listOpen, setListOpen] = useState(false);
  const answer = formAnswers[index]?.answer;
  const note = formAnswers[index]?.note ?? '';

  return (
    <div className='w-full sm:max-w-md border border-border shadow-floating rounded-md py-4 px-4 h-max'>
      <div className='flex flex-col sm:flex-row  justify-between gap-4 flex-wrap'>
        <div className='flex flex-col justify-between '>
          <div>
            <h1>
              {new Date(pdt.dateTime).toLocaleDateString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h1>
            <h2 className='text-muted-foreground text-sm'>
              {new Date(pdt.dateTime).toLocaleTimeString([], {
                timeStyle: 'short',
              })}
            </h2>
            {pdt.note && (
              <p className='text-muted-foreground text-xs mt-1 italic'>
                {pdt.note}
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2 py-3'>
          <Button
            type='button'
            size='icon'
            variant='outline'
            className={cn(
              'text-muted-foreground',
              answer === 'yes' &&
                'bg-success hover:bg-success text-primary-foreground'
            )}
            onClick={() =>
              setFormAnswer(index, {
                potentialDateTimeId: pdt._id,
                answer: 'yes',
              })
            }
          >
            <Icons.check />
          </Button>
          <Button
            type='button'
            size='icon'
            variant='outline'
            className={cn(
              'text-muted-foreground',
              answer === 'maybe' &&
                'bg-warning hover:bg-warning text-primary-foreground'
            )}
            onClick={() =>
              setFormAnswer(index, {
                potentialDateTimeId: pdt._id,
                answer: 'maybe',
              })
            }
          >
            <span className='font-semibold text-lg'>?</span>
          </Button>
          <Button
            type='button'
            size='icon'
            variant='outline'
            className={cn(
              'text-muted-foreground',
              answer === 'no' &&
                'bg-error hover:bg-error text-primary-foreground'
            )}
            onClick={() =>
              setFormAnswer(index, {
                potentialDateTimeId: pdt._id,
                answer: 'no',
              })
            }
          >
            <Icons.close />
          </Button>
        </div>
      </div>
      <div className='relative mt-2'>
        <Textarea
          value={note}
          onChange={e => setFormNote(index, e.target.value)}
          placeholder='Add a note (optional)'
          maxLength={200}
          className='min-h-[40px] text-sm resize-none'
          rows={1}
        />
        <span className='absolute bottom-1.5 right-3 text-xs text-muted-foreground'>
          {note.length}/200
        </span>
      </div>
      <div
        onClick={() => setListOpen(!listOpen)}
        className='flex items-center py-1 px-2 hover:bg-accent/80 rounded-md justify-between w-max gap-2 cursor-pointer'
      >
        <div className='flex items-center gap-2 text-xs'>
          <div className='flex items-center gap-1'>
            <Icons.check className='size-4 text-success' />
            <span>
              {pdt.availabilities
                .filter(a => a.status === 'YES' && a.member !== null)
                .length.toString()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-sm text-warning'>?</span>
            <span>
              {pdt.availabilities
                .filter(a => a.status === 'MAYBE' && a.member !== null)
                .length.toString()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Icons.close className='size-4 text-error' />
            <span>
              {pdt.availabilities
                .filter(a => a.status === 'NO' && a.member !== null)
                .length.toString()}
            </span>
          </div>
        </div>
        {!listOpen ? (
          <Icons.down className='size-4 text-muted-foreground' />
        ) : (
          <Icons.up className='size-4 text-muted-foreground' />
        )}
      </div>
      {listOpen && (
        <div className='flex flex-col gap-2 py-1'>
          {(['YES', 'MAYBE', 'NO'] as const).map(status => {
            const filtered = pdt.availabilities.filter(
              a => a.status === status && a.member !== null
            );
            if (filtered.length === 0) return null;
            return (
              <div key={status}>
                <div className='flex items-center gap-1'>
                  {status === 'YES' && (
                    <>
                      <Icons.check className='size-6 text-success' />
                      <span>Yes</span>
                    </>
                  )}
                  {status === 'MAYBE' && (
                    <>
                      <span className='font-semibold w-6 text-xl text-warning text-center'>
                        ?
                      </span>
                      <span>Maybe</span>
                    </>
                  )}
                  {status === 'NO' && (
                    <>
                      <Icons.close className='size-6 text-error' />
                      <span>No</span>
                    </>
                  )}
                </div>
                <div className='flex flex-col divide-y ml-6'>
                  {filtered.map(a => {
                    const member = a.member;
                    return (
                      <div
                        key={member._id + pdt._id}
                        className='flex flex-col py-3'
                      >
                        <div className='flex items-center gap-2'>
                          <Avatar className='size-6'>
                            <AvatarFallback>
                              {getInitialsFromName(
                                member.person?.user?.name ?? undefined,
                                member.person?.user?.email ?? undefined
                              )}
                            </AvatarFallback>
                            <AvatarImage
                              src={member.person?.user?.image || undefined}
                            />
                          </Avatar>
                          <span>
                            {member.person?.user?.name ||
                              member.person?.user?.email}
                          </span>
                        </div>
                        {a.note && (
                          <p className='text-muted-foreground text-xs ml-8 mt-1 italic'>
                            {a.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
