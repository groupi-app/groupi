'use client';
import { TypeAnimation } from 'react-type-animation';

const wordPool = [
  'doing',
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

// Build sequence from words array
function buildSequence(words: string[]): (number | string)[] {
  const seq: (number | string)[] = [];
  for (const word of words) {
    seq.push(word + '.');
    seq.push(2000);
  }
  return seq;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate shuffled sequence at module load time (client-side only due to 'use client')
const sequence = buildSequence(shuffleArray(wordPool));

export function HomeHeader() {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-5xl md:text-6xl font-heading'>
        Spend less time planning and more time{' '}
      </span>
      <TypeAnimation
        sequence={sequence}
        speed={50}
        className='text-5xl md:text-6xl font-heading text-primary'
        repeat={Infinity}
      />
    </div>
  );
}
