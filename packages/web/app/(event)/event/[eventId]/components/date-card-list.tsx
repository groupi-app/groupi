'use client';
import { DateCard } from './date-card';
import { useEventAvailabilityData } from '@/hooks/convex/use-availability';
import { Id } from '@/convex/_generated/dataModel';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export function DateCardList({ eventId }: { eventId: Id<'events'> }) {
  const [sortBy, setSortBy] = useState<'rank' | 'date'>('rank');

  // Use Convex hook for real-time availability data
  const availabilityData = useEventAvailabilityData(eventId);

  // Loading state
  if (availabilityData === undefined) {
    return (
      <div className='animate-pulse space-y-4'>
        <div className='h-8 bg-muted rounded w-48'></div>
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='h-24 bg-muted rounded'></div>
          ))}
        </div>
      </div>
    );
  }

  const potentialDateTimes = availabilityData.potentialDateTimes;
  const userId = availabilityData.userId;
  const userRole = availabilityData.userRole;

  // Calculate ranks for sorting - getRanks returns items with rank property
  const rankedDates = getRanks(potentialDateTimes);

  const sort = (a: (typeof rankedDates)[0], b: (typeof rankedDates)[0]) => {
    switch (sortBy) {
      case 'rank':
        // sort by rank, then by date if ranks are equal
        return a.rank - b.rank || a.dateTime - b.dateTime;
      case 'date':
        // sort by date (dateTime is a number timestamp)
        return a.dateTime - b.dateTime;
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
          {rankedDates.sort(sort).map(pdt => (
            <motion.div layout variants={item} key={pdt._id}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <DateCard pdt={pdt as any} userId={userId} userRole={userRole} />
            </motion.div>
          ))}
        </LayoutGroup>
      </motion.div>
    </>
  );
}
