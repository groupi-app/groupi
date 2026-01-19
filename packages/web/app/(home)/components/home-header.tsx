'use client';
import { TypeAnimation } from 'react-type-animation';
import { useState, useEffect } from 'react';

export function HomeHeader() {
  // Default sequence for prerender/hydration
  const defaultSequence: (number | string)[] = ['doing', 'doing.', 2000];
  const [sequence, setSequence] = useState(defaultSequence);
  // Generate random sequence only on client side after mount
  useEffect(() => {
    const wordPool = [
      'hanging',
      'partying',
      'playing',
      'relaxing',
      'fishing',
      'bowling',
      'golfing',
      'shopping',
      'gardening',
      'hiking',
      'camping',
      'skating',
      'painting',
      'dancing',
      'singing',
      'biking',
      'gaming',
      'baking',
      'climbing',
      'exploring',
      'traveling',
      'bonding',
      'celebrating',
      'loving',
      'connecting',
      'discovering',
      'experiencing',
      'enjoying',
      'learning',
      'living',
    ];
    const seq: (number | string)[] = ['doing'];
    const wordPoolCopy = [...wordPool];

    // Shuffle the wordPoolCopy array
    for (let i = wordPoolCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordPoolCopy[i], wordPoolCopy[j]] = [wordPoolCopy[j], wordPoolCopy[i]];
    }

    for (let i = 0; i < wordPoolCopy.length; i++) {
      seq.push(wordPoolCopy[i] + '.');
      seq.push(2000);
    }

    setTimeout(() => {
      setSequence(seq);
    }, 0);
  }, []); // Empty deps - only run once on mount
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-5xl md:text-6xl font-heading'>
        Spend less time planning and more time{' '}
      </span>
      <TypeAnimation
        preRenderFirstString={true}
        sequence={sequence}
        speed={50}
        className='text-5xl md:text-6xl font-heading text-primary'
        repeat={Infinity}
      />
    </div>
  );
}
