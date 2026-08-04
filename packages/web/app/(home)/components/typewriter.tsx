'use client';

import { TypeAnimation } from 'react-type-animation';

const TYPEWRITER_SEQUENCE: (string | number)[] = [
  'hanging.',
  2000,
  'partying.',
  2000,
  'playing.',
  2000,
  'celebrating.',
  2000,
  'exploring.',
  2000,
  'traveling.',
  2000,
  'connecting.',
  2000,
  'bonding.',
  2000,
  'discovering.',
  2000,
  'experiencing.',
  2000,
  'enjoying.',
  2000,
  'living.',
  2000,
  'relaxing.',
  2000,
  'gaming.',
  2000,
  'dancing.',
  2000,
  'hiking.',
  2000,
  'camping.',
  2000,
  'fishing.',
  2000,
  'bowling.',
  2000,
  'golfing.',
  2000,
  'skating.',
  2000,
  'biking.',
  2000,
  'baking.',
  2000,
  'painting.',
  2000,
  'singing.',
  2000,
  'gardening.',
  2000,
  'shopping.',
  2000,
  'climbing.',
  2000,
  'learning.',
  2000,
  'loving.',
  2000,
];

export function Typewriter() {
  return (
    <TypeAnimation
      preRenderFirstString={true}
      sequence={TYPEWRITER_SEQUENCE}
      speed={50}
      className='text-3xl md:text-4xl lg:text-5xl font-black text-primary leading-tight'
      repeat={Infinity}
    />
  );
}
