'use client';

import { Icons } from '@/components/icons';

const EXAMPLES: Array<{
  input: string;
  result: string;
  category: string;
}> = [
  { category: 'Basics', input: 'Fr@19', result: 'Friday at 7 PM' },
  { category: 'Basics', input: 'Sa', result: 'Saturday, all day' },
  { category: 'Basics', input: 'Tu@14-16', result: 'Tuesday 2–4 PM' },
  { category: 'Basics', input: 'Fr@6pm', result: 'Friday at 6 PM' },
  {
    category: 'Basics',
    input: 'Fr@22^3h',
    result: 'Friday 10 PM – 1 AM (3 hours)',
  },
  {
    category: 'Lists',
    input: '[Tu,Th]@18-20',
    result: 'Tue and Thu, 6–8 PM (2 options)',
  },
  {
    category: 'Lists',
    input: 'Fr@[18,19,20]',
    result: 'Friday at 6, 7, or 8 PM (3 options)',
  },
  {
    category: 'Lists',
    input: '[Tu,Th]@[18,19]',
    result: 'Tue at 6, 7 + Thu at 6, 7 (4 options)',
  },
  {
    category: 'Ranges',
    input: '(Mo,Fr)@9-17',
    result: 'Mon through Fri, 9–5 (5 options)',
  },
  {
    category: 'Ranges',
    input: 'Fr@(18,20)',
    result: 'Friday at 6, 7, 8 PM (3 options)',
  },
  {
    category: 'Recurrence',
    input: 'Tu*3@14',
    result: 'Next 3 Tuesdays at 2 PM',
  },
  {
    category: 'Recurrence',
    input: '[Tu*2,Th*3]@14',
    result: 'Next 2 Tue + 3 Thu at 2 PM (5 options)',
  },
  {
    category: 'Dates',
    input: '08/10@14-17',
    result: 'August 10, 2–5 PM',
  },
  {
    category: 'Dates',
    input: '(10,15)@6pm',
    result: '10th–15th of month at 6 PM (6 options)',
  },
  {
    category: 'Stepped Ranges',
    input: 'Fr@(18,22,2)',
    result: 'Friday at 6, 8, 10 PM (3 options)',
  },
  {
    category: 'Stepped Ranges',
    input: 'Fr@7^(2h,4h)',
    result: '7–9, 7–10, 7–11 AM (3 duration options)',
  },
  {
    category: 'Stepped Ranges',
    input: '(10,20,5)@18',
    result: '10th, 15th, 20th at 6 PM (3 options)',
  },
  {
    category: 'Combining',
    input: 'Tu*3@10 + Fr@18-20',
    result: '3 Tuesdays at 10 AM + Friday 6–8 PM',
  },
  {
    category: 'Notes',
    input: 'Fr@19 "dinner"',
    result: 'Friday 7 PM with note "dinner"',
  },
  {
    category: 'Advanced',
    input: 'Fr@[13,14]-[17,18]',
    result: '4 span options (start × end)',
  },
  {
    category: 'Advanced',
    input: 'Fr@[18,19,20]^2h',
    result: '6–8, 7–9, 8–10 PM (3 spans)',
  },
];

const SYMBOLS: Array<{ symbol: string; name: string; description: string }> = [
  { symbol: '@', name: 'At', description: 'Attach time to a day or date' },
  { symbol: '-', name: 'Span', description: 'Event from start to end time' },
  {
    symbol: '^',
    name: 'Duration',
    description: 'Duration from start (e.g., ^3h, ^90m)',
  },
  { symbol: '+', name: 'Combine', description: 'Union of multiple entries' },
  {
    symbol: '[ ]',
    name: 'List',
    description: 'Specific items: [Tu,Th] or [18,19,20]',
  },
  {
    symbol: '( )',
    name: 'Range',
    description: 'Expand start to end: (Mo,Fr) or (18,22)',
  },
  {
    symbol: '*',
    name: 'Repeat',
    description: 'Recurrence count: Tu*3 = next 3 Tuesdays',
  },
  { symbol: '" "', name: 'Note', description: 'Attach a label: "dinner"' },
];

const DAYS = [
  { abbr: 'Mo', day: 'Monday' },
  { abbr: 'Tu', day: 'Tuesday' },
  { abbr: 'We', day: 'Wednesday' },
  { abbr: 'Th', day: 'Thursday' },
  { abbr: 'Fr', day: 'Friday' },
  { abbr: 'Sa', day: 'Saturday' },
  { abbr: 'Su', day: 'Sunday' },
];

const categories = [...new Set(EXAMPLES.map(e => e.category))];

export default function GDLReferencePage() {
  return (
    <div className='mx-auto max-w-2xl px-4 py-12'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold mb-2'>Groupi Date Language (GDL)</h1>
        <p className='text-muted-foreground'>
          A shorthand syntax for quickly entering complex date and time options.
          Type GDL directly into the date input field — it&apos;ll be detected
          automatically.
        </p>
      </div>

      <section className='mb-10'>
        <h2 className='text-lg font-semibold mb-3'>Symbols</h2>
        <div className='grid gap-2'>
          {SYMBOLS.map(s => (
            <div
              key={s.symbol}
              className='flex items-center gap-3 rounded-card bg-card p-3'
            >
              <code className='w-10 text-center font-mono text-sm font-bold text-purple-400'>
                {s.symbol}
              </code>
              <div className='flex-1'>
                <span className='text-sm font-medium'>{s.name}</span>
                <span className='text-sm text-muted-foreground'>
                  {' — '}
                  {s.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='mb-10'>
        <h2 className='text-lg font-semibold mb-3'>Day Abbreviations</h2>
        <div className='flex flex-wrap gap-2'>
          {DAYS.map(d => (
            <div
              key={d.abbr}
              className='rounded-badge bg-card px-3 py-1.5 text-sm'
            >
              <code className='font-mono font-bold text-blue-400'>
                {d.abbr}
              </code>
              <span className='text-muted-foreground'> = {d.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className='mb-10'>
        <h2 className='text-lg font-semibold mb-3'>Time Format</h2>
        <div className='rounded-card bg-card p-4 text-sm space-y-2'>
          <p>
            GDL uses <strong>24-hour time</strong> by default.{' '}
            <code className='text-amber-400'>@14</code> = 2 PM,{' '}
            <code className='text-amber-400'>@0</code> = midnight.
          </p>
          <p>
            You can also use am/pm: <code className='text-amber-400'>@6pm</code>{' '}
            = <code className='text-amber-400'>@18</code>
          </p>
          <p>
            Minutes with a colon: <code className='text-amber-400'>@14:30</code>{' '}
            = 2:30 PM
          </p>
        </div>
      </section>

      <section className='mb-10'>
        <h2 className='text-lg font-semibold mb-3'>Lists vs Ranges vs Spans</h2>
        <div className='rounded-card bg-card p-4 text-sm space-y-3'>
          <div className='flex items-start gap-3'>
            <code className='text-purple-300 font-mono shrink-0'>[ ]</code>
            <div>
              <strong>List</strong> — exactly these items.{' '}
              <code>Fr@[18,20,22]</code> = 6 PM, 8 PM, 10 PM
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <code className='text-purple-300 font-mono shrink-0'>( )</code>
            <div>
              <strong>Range</strong> — every step between two endpoints.{' '}
              <code>Fr@(18,22)</code> = 6, 7, 8, 9, 10 PM. Optional third item
              sets step size: <code>Fr@(18,22,2)</code> = 6, 8, 10 PM
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <code className='text-purple-400 font-mono shrink-0'>a-b</code>
            <div>
              <strong>Span</strong> — one event with a start and end.{' '}
              <code>Fr@18-22</code> = 6 PM to 10 PM
            </div>
          </div>
        </div>
      </section>

      <section className='mb-10'>
        <h2 className='text-lg font-semibold mb-4'>Examples</h2>
        {categories.map(cat => (
          <div key={cat} className='mb-6'>
            <h3 className='text-sm font-medium text-muted-foreground mb-2'>
              {cat}
            </h3>
            <div className='space-y-1.5'>
              {EXAMPLES.filter(e => e.category === cat).map(ex => (
                <div
                  key={ex.input}
                  className='flex items-center gap-3 rounded-card bg-card px-4 py-2.5'
                >
                  <code className='font-mono text-sm text-foreground shrink-0'>
                    {ex.input}
                  </code>
                  <Icons.arrowRight className='size-3 text-muted-foreground shrink-0' />
                  <span className='text-sm text-muted-foreground'>
                    {ex.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className='mb-10'>
        <h2 className='text-lg font-semibold mb-3'>Tips</h2>
        <ul className='space-y-2 text-sm text-muted-foreground list-disc list-inside'>
          <li>
            If end time is before start, it wraps to the next day:{' '}
            <code className='text-foreground'>Fr@21-2</code> = 9 PM to 2 AM
          </li>
          <li>
            Use <code className='text-foreground'>^</code> for duration:{' '}
            <code className='text-foreground'>Fr@22^4h</code> = 10 PM for 4
            hours
          </li>
          <li>
            Lists and ranges cross-multiply:{' '}
            <code className='text-foreground'>[Tu,Th]@[18,19]</code> = 4 options
          </li>
          <li>Maximum 20 date options per expression</li>
          <li>
            Combine with <code className='text-foreground'>+</code> for
            independent groups
          </li>
        </ul>
      </section>
    </div>
  );
}
