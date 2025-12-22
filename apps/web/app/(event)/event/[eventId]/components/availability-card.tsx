'use client';

import { cn, getInitialsFromName } from '@/lib/utils';
import { PotentialDateTimeWithAvailabilities } from '@/types';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function AvailabilityCard({
  pdt,
  formAnswers,
  setFormAnswer,
  index,
}: {
  pdt: PotentialDateTimeWithAvailabilities;
  formAnswers: { potentialDateTimeId: string; answer: string }[];
  setFormAnswer: (
    index: number,
    value: { potentialDateTimeId: string; answer: 'yes' | 'no' | 'maybe' }
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
                potentialDateTimeId: pdt.id,
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
                potentialDateTimeId: pdt.id,
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
                potentialDateTimeId: pdt.id,
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
                .filter(a => a.status === 'YES')
                .length.toString()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-sm text-yellow-500'>?</span>
            <span>
              {pdt.availabilities
                .filter(a => a.status === 'MAYBE')
                .length.toString()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Icons.close className='size-4 text-red-500' />
            <span>
              {pdt.availabilities
                .filter(a => a.status === 'NO')
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
          {pdt.availabilities.filter(a => a.status === 'YES').length > 0 && (
            <div>
              <div className='flex items-center gap-1'>
                <Icons.check className='size-6 text-green-500' />
                <span>Yes</span>
              </div>
              <div className='flex flex-col divide-y ml-3'>
                {pdt.availabilities
                  .filter(a => a.status === 'YES')
                  .map(a => (
                    <div
                      key={a.membership.id + pdt.id}
                      className='flex items-center gap-2 py-2'
                    >
                      <Avatar className='size-6'>
                        <AvatarFallback>
                          {(
                            a.membership.person.user?.name?.[0] || ''
                          ).toUpperCase()}
                        </AvatarFallback>
                        <AvatarImage
                          src={a.membership.person.user?.image || undefined}
                        />
                      </Avatar>
                      <span>
                        {a.membership.person.user?.name ||
                          a.membership.person.user?.email}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {pdt.availabilities.filter(a => a.status === 'MAYBE').length > 0 && (
            <div>
              <div className='flex items-center gap-1'>
                <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                  ?
                </span>
                <span>Maybe</span>
              </div>
              <div className='flex flex-col divide-y ml-3'>
                {pdt.availabilities
                  .filter(a => a.status === 'MAYBE')
                  .map(a => (
                    <div
                      key={a.membership.id + pdt.id}
                      className='flex items-center gap-2 py-2'
                    >
                      <Avatar className='size-6'>
                        <AvatarFallback>
                          {getInitialsFromName(
                            a.membership.person.user?.name ?? undefined,
                            a.membership.person.user?.email ?? undefined
                          )}
                        </AvatarFallback>
                        <AvatarImage
                          src={a.membership.person.user?.image || undefined}
                        />
                      </Avatar>
                      <span>
                        {a.membership.person.user?.name ||
                          a.membership.person.user?.email}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {pdt.availabilities.filter(a => a.status === 'NO').length > 0 && (
            <div>
              <div className='flex items-center gap-1'>
                <Icons.close className='size-6 text-red-500' />
                <span>No</span>
              </div>
              <div className='flex flex-col divide-y ml-3'>
                {pdt.availabilities
                  .filter(a => a.status === 'NO')
                  .map(a => (
                    <div
                      key={a.membership.id + pdt.id}
                      className='flex items-center gap-2 py-2'
                    >
                      <Avatar className='size-6'>
                        <AvatarFallback>
                          {getInitialsFromName(
                            a.membership.person.user?.name ?? undefined,
                            a.membership.person.user?.email ?? undefined
                          )}
                        </AvatarFallback>
                        <AvatarImage
                          src={a.membership.person.user?.image || undefined}
                        />
                      </Avatar>
                      <span>
                        {a.membership.person.user?.name ||
                          a.membership.person.user?.email}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
