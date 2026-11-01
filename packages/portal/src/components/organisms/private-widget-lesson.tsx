'use client';
import { useState } from 'react';
import { learningDefaults } from '../../learning-examples';

const states = {
  success: learningDefaults.title,
  loading: 'Loading permitted Events…',
  empty: 'No Events yet. An empty list is a successful response.',
  error:
    'Unable to read Events. Check the intended instance, account and read permission locally. Do not substitute a more powerful key.',
};
type WidgetState = keyof typeof states;

export function PrivateWidgetLesson() {
  const [selected, setSelected] = useState<WidgetState>('success');
  const [state, setState] = useState<WidgetState>('success');
  return (
    <section
      className='learning-lesson'
      aria-label='Private Event widget simulation'
    >
      <p className='eyebrow'>Simulation · private local preview</p>
      <h2>Your finished Event widget</h2>
      <article className='event-preview' aria-label='Private widget preview'>
        <h3>My Events</h3>
        <div role='status' aria-label='Widget state' aria-live='polite'>
          <p>{states[state]}</p>
          {state === 'success' ? (
            <>
              <p>Undated · Organizer · No invitations sent</p>
              <code>{learningDefaults.eventId}</code>
            </>
          ) : null}
        </div>
      </article>
      <p>
        This is a private local preview, not a public feed. Permission to read
        an Event is not permission to republish it. No realtime delivery is
        promised.
      </p>
      <p>
        Prerequisites for the local version: verify the intended instance and
        account, obtain permitted read access, and keep the key in a local
        process. Any preview service must bind only to 127.0.0.1 or ::1, never a
        LAN or public interface.
      </p>
      <label>
        Widget fixture state
        <select
          value={selected}
          onChange={event => setSelected(event.target.value as WidgetState)}
        >
          <option value='success'>Success</option>
          <option value='loading'>Loading</option>
          <option value='empty'>Empty</option>
          <option value='error'>Error</option>
        </select>
      </label>
      <div className='document-actions'>
        <button type='button' onClick={() => setState(selected)}>
          Refresh simulation
        </button>
        <button
          type='button'
          onClick={() => {
            setSelected('success');
            setState('success');
          }}
        >
          Reset widget simulation
        </button>
      </div>
      <p>
        Simulated fixture states only. Refresh makes no request and accepts no
        credentials.
      </p>
      <a href='/v2/integrator'>First complete the own-account Event lesson</a>
    </section>
  );
}
