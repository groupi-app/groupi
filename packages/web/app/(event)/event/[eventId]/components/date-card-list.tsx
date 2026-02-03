'use client';
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
import { getRanks } from '@/lib/utils';

import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { useEventData } from '../context';
import { Skeleton } from '@/components/ui/skeleton';

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

export function DateCardList() {
  const [sortBy, setSortBy] = useState<'rank' | 'date'>('rank');

  // Use context data (pre-fetched at layout level)
  const { availabilityData } = useEventData();

  // Loading state - show actual controls with skeleton data
  if (availabilityData === undefined) {
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
        <div className='flex flex-col gap-3'>
          <DateCardSkeleton />
          <DateCardSkeleton />
          <DateCardSkeleton />
        </div>
      </>
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

/**
 * DateCardSkeleton - Skeleton for a single date card
 * Matches DateCard: rank, date, time, yes/maybe/no counts, progress bar
 */
function DateCardSkeleton() {
  return (
    <div className='w-full md:max-w-lg border border-border shadow-floating rounded-md py-4 px-4 bg-card'>
      <div className='flex items-start gap-4'>
        {/* Rank */}
        <Skeleton className='h-8 w-8' />
        <div className='flex flex-col gap-1'>
          {/* Date */}
          <Skeleton className='h-6 w-48' />
          {/* Time range */}
          <Skeleton className='h-4 w-32' />
        </div>
      </div>
      {/* Yes/Maybe/No counts */}
      <div className='flex items-center gap-4 mt-4'>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-6 rounded-full' />
          <Skeleton className='h-4 w-4' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-6 rounded-full' />
          <Skeleton className='h-4 w-4' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-6 rounded-full' />
          <Skeleton className='h-4 w-4' />
        </div>
      </div>
      {/* Progress bar */}
      <Skeleton className='w-full h-4 rounded-full mt-2' />
    </div>
  );
}
