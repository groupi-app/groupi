'use client';
import { useState } from 'react';
import { searchPassages } from '../../search';
import { Highlight } from '../atoms/highlight';
export function DeveloperSearch() {
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState('all');
  const [availability, setAvailability] = useState('all');
  const results = searchPassages(query, version, availability);
  return (
    <section className='search-section' aria-label='Developer search'>
      <label htmlFor='developer-search'>Search developer docs</label>
      <input
        id='developer-search'
        type='search'
        placeholder='Try ‘create an event’ or an exact command'
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <div className='search-filters'>
        <label>
          Search version
          <select
            value={version}
            onChange={event => setVersion(event.target.value)}
          >
            <option value='all'>All versions</option>
            <option value='v2'>REST v2</option>
            <option value='v1'>REST v1</option>
            <option value='cli-0.1.0'>CLI 0.1.0</option>
          </select>
        </label>
        <label>
          Availability
          <select
            value={availability}
            onChange={event => setAvailability(event.target.value)}
          >
            <option value='all'>All availability</option>
            <option>Current</option>
            <option>Upcoming</option>
            <option>Proposed</option>
          </select>
        </label>
      </div>
      {query ? (
        <>
          <p role='status'>
            {results.length
              ? `${results.length} matching passages`
              : 'No passages found. Try fewer words, reset filters or browse the API and CLI reference.'}
          </p>
          <button
            type='button'
            onClick={() => {
              setVersion('all');
              setAvailability('all');
            }}
          >
            Reset filters
          </button>
          <ol aria-label='Search results'>
            {results.map(result => (
              <li key={result.id}>
                <a href={result.href}>
                  <Highlight text={result.title} query={query} />
                </a>
                <p className='result-context'>
                  {result.pageTitle} · {result.version} · {result.availability}
                </p>
                <p>
                  <Highlight text={result.text.slice(0, 240)} query={query} />
                </p>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className='search-hint'>
          Guides, concepts, troubleshooting, API and CLI in one public index.
        </p>
      )}
    </section>
  );
}
