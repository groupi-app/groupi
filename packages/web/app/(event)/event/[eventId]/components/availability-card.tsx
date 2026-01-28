'use client';

import { cn, getInitialsFromName } from '@/lib/utils';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  index,
}: {
  pdt: PotentialDateTime;
  formAnswers: Array<{
    potentialDateTimeId: string;
    answer: 'yes' | 'maybe' | 'no';
  }>;
  setFormAnswer: (
    index: number,
    value: { potentialDateTimeId: string; answer: 'yes' | 'maybe' | 'no' }
  ) => void;
  index: number;
}) {
  const [listOpen, setListOpen] = useState(false);
  const answer = formAnswers[index]?.answer;

  return (
    <div className='w-full sm:max-w-md border border-border shadow-md rounded-md py-2 px-3 h-max'>
      <div className='flex flex-col sm:flex-row  justify-between gap-2 flex-wrap'>
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
          </div>
        </div>
        <div className='flex items-center gap-1 py-2'>
          <Button
            type='button'
            size='icon'
            variant='outline'
            className={cn(
              'text-muted-foreground',
              answer === 'yes' &&
                'bg-green-500 hover:bg-green-500 text-primary-foreground'
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
                'bg-yellow-500 hover:bg-yellow-500 text-primary-foreground'
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
                'bg-red-500 hover:bg-red-500 text-primary-foreground'
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
      <div
        onClick={() => setListOpen(!listOpen)}
        className='flex items-center py-1 px-2 hover:bg-accent rounded-md justify-between w-max gap-2 cursor-pointer'
      >
        <div className='flex items-center gap-2 text-xs'>
          <div className='flex items-center gap-1'>
            <Icons.check className='size-4 text-green-500' />
            <span>
              {pdt.availabilities
                .filter(a => a.status === 'YES' && a.member !== null)
                .length.toString()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-sm text-yellow-500'>?</span>
            <span>
              {pdt.availabilities
                .filter(a => a.status === 'MAYBE' && a.member !== null)
                .length.toString()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Icons.close className='size-4 text-red-500' />
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
          {pdt.availabilities.filter(
            a => a.status === 'YES' && a.member !== null
          ).length > 0 && (
            <div>
              <div className='flex items-center gap-1'>
                <Icons.check className='size-6 text-green-500' />
                <span>Yes</span>
              </div>
              <div className='flex flex-col divide-y ml-3'>
                {pdt.availabilities
                  .filter(a => a.status === 'YES' && a.member !== null)
                  .map(a => {
                    const member = a.member; // Non-null assertion after filter
                    return (
                      <div
                        key={member._id + pdt._id}
                        className='flex items-center gap-2 py-2'
                      >
                        <Avatar className='size-6'>
                          <AvatarFallback>
                            {(
                              member.person?.user?.name?.[0] || ''
                            ).toUpperCase()}
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
                    );
                  })}
              </div>
            </div>
          )}
          {pdt.availabilities.filter(
            a => a.status === 'MAYBE' && a.member !== null
          ).length > 0 && (
            <div>
              <div className='flex items-center gap-1'>
                <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                  ?
                </span>
                <span>Maybe</span>
              </div>
              <div className='flex flex-col divide-y ml-3'>
                {pdt.availabilities
                  .filter(a => a.status === 'MAYBE' && a.member !== null)
                  .map(a => {
                    const member = a.member; // Non-null assertion after filter
                    return (
                      <div
                        key={member._id + pdt._id}
                        className='flex items-center gap-2 py-2'
                      >
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
                    );
                  })}
              </div>
            </div>
          )}
          {pdt.availabilities.filter(
            a => a.status === 'NO' && a.member !== null
          ).length > 0 && (
            <div>
              <div className='flex items-center gap-1'>
                <Icons.close className='size-6 text-red-500' />
                <span>No</span>
              </div>
              <div className='flex flex-col divide-y ml-3'>
                {pdt.availabilities
                  .filter(a => a.status === 'NO' && a.member !== null)
                  .map(a => {
                    const member = a.member; // Non-null assertion after filter
                    return (
                      <div
                        key={member._id + pdt._id}
                        className='flex items-center gap-2 py-2'
                      >
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
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
