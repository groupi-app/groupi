'use client';
import { PotentialDateTimeWithAvailabilities } from '@/types';
import { DateCard } from './date-card';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePDTs } from '@groupi/hooks';
import { getRanks } from '@/lib/utils';

import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export function DateCardList({ eventId }: { eventId: string }) {
  const [sortBy, setSortBy] = useState<'rank' | 'date'>('rank');
  const { data, isLoading } = usePDTs(eventId);

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const [error, pdtData] = data;

  if (error) {
    switch (error._tag) {
      case 'AvailabilityNotFoundError':
        return <div>Date options not found</div>;
      case 'AvailabilityEventNotFoundError':
        return <div>Event not found</div>;
      case 'AvailabilityUserNotMemberError':
        return <div>You are not a member of this event</div>;
      case 'UnauthorizedAvailabilityError':
        return <div>You are not authorized to view date options</div>;
      default:
        return <div>Error loading date options</div>;
    }
  }

  // If error is null, pdtData is guaranteed to exist

  const potentialDateTimes = pdtData?.potentialDateTimes || [];
  const userId = pdtData?.userId;
  const userRole = pdtData?.userRole;

  const sort = (
    a: PotentialDateTimeWithAvailabilities & { rank: number },
    b: PotentialDateTimeWithAvailabilities & { rank: number }
  ) => {
    switch (sortBy) {
      case 'rank':
        // sort by rank, then by date if ranks are equal
        return (
          a.rank - b.rank ||
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );
      case 'date':
        // sort by date
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    }
  };

  return (
    <>
      <div className='w-36 my-2'>
        <Select
          value={sortBy}
          onValueChange={value => setSortBy(value as 'rank' | 'date')}
        >
          <SelectTrigger>
            <SelectValue placeholder='Sort By' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort By</SelectLabel>
              <SelectItem value='rank'>Rank</SelectItem>
              <SelectItem value='date'>Date</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <motion.div
        initial='hidden'
        animate='show'
        variants={container}
        className='flex flex-col gap-3'
      >
        <LayoutGroup>
          {
            /* @ts-expect-error: Temporary fix - getRanks function needs to be updated for new data structure */
            getRanks(potentialDateTimes)
              .sort(sort)
              .map(pdt => (
                <motion.div layout variants={item} key={pdt.id}>
                  <DateCard pdt={pdt} userId={userId} userRole={userRole} />
                </motion.div>
              ))
          }
        </LayoutGroup>
      </motion.div>
    </>
  );
}
