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
import { usePDTs } from '@/data/pdt-hooks';
import { getRanks } from '@/lib/utils';
import { Role } from '@prisma/client';
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
  const { data: pdtData } = usePDTs(eventId);
  const {
    potentialDateTimes,
    userId,
    userRole,
  }: {
    potentialDateTimes: PotentialDateTimeWithAvailabilities[];
    userId: string;
    userRole: Role;
  } = pdtData;

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
          {getRanks(potentialDateTimes)
            .sort(sort)
            .map(pdt => (
              <motion.div layout variants={item} key={pdt.id}>
                <DateCard pdt={pdt} userId={userId} userRole={userRole} />
              </motion.div>
            ))}
        </LayoutGroup>
      </motion.div>
    </>
  );
}
