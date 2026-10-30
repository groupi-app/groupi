import { fireEvent, render, screen, within } from '@testing-library/react';
import { test, expect } from 'vitest';
import { Portal } from '../src';
import { searchAcceptance } from './search-acceptance';
test('representative reader searches reach the correct passage in the first three at least ninety percent of the time', () => {
  render(<Portal />);
  const input = screen.getByRole('searchbox');
  const misses: string[] = [];
  const durations: number[] = [];
  for (const [query, expected] of searchAcceptance) {
    const started = performance.now();
    fireEvent.change(input, { target: { value: query } });
    const links = within(screen.getByRole('list', { name: 'Search results' }))
      .queryAllByRole('link')
      .slice(0, 3)
      .map(link => link.getAttribute('href'));
    durations.push(performance.now() - started);
    if (!links.includes(expected))
      misses.push(`${query}: expected ${expected}; got ${links.join(', ')}`);
    if (query.startsWith('groupi ') || /^(GET|POST) \/api/.test(query))
      expect(links[0], query).toBe(expected);
  }
  const p95 = [...durations].sort((a, b) => a - b)[
    Math.ceil(durations.length * 0.95) - 1
  ];
  console.info(
    `Rendered reader search p95: ${p95.toFixed(1)}ms (jsdom runner, not physical mobile).`
  );
  console.info(
    `Search quality: ${searchAcceptance.length - misses.length}/${searchAcceptance.length} top-three; misses: ${misses.join('\n')}`
  );
  expect(misses.length, misses.join('\n')).toBeLessThanOrEqual(
    Math.floor(searchAcceptance.length * 0.1)
  );
});
