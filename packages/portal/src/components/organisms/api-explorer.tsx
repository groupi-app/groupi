'use client';
import { useState } from 'react';
import {
  simulateCreate,
  simulationPrerequisites as prerequisites,
  type SimulationState,
} from '../../learning-simulation';
export function ApiExplorer() {
  const [identity, setIdentity] = useState('organizer');
  const [scenario, setScenario] = useState('ready');
  const [title, setTitle] = useState('Developer dinner');
  const [lost, setLost] = useState(false);
  const [state, setState] = useState<SimulationState>({
    response: 'Choose a simulated operation.',
  });
  const { event, retained, response } = state;
  const setResponse = (response: string) =>
    setState(current => ({ ...current, response }));
  function prerequisiteFailed() {
    const failure = prerequisites[scenario];
    if (failure) {
      setResponse(failure);
      return true;
    }
    return false;
  }
  function create(replay: boolean) {
    setState(current =>
      simulateCreate(current, {
        title,
        identity,
        scenario,
        lost,
        replay,
        eventId: 'demo-event-1',
      })
    );
  }
  return (
    <article className='document'>
      <p className='eyebrow'>Demo only · In-memory fixture</p>
      <h1 tabIndex={-1}>Simulated API explorer</h1>
      <p>
        No network requests, credentials or persisted data. Choose a teaching
        scenario and inspect the simulated response.
      </p>
      <details>
        <summary>Simulation boundaries and permissions</summary>
        <p>
          Demo instance: local fixture. Organizer and Attendee are synthetic
          identities. The denied scenario does not mean real attendees cannot
          create their own events: real access depends on current authority and
          credential bounds. This demonstration is not security or deployment
          evidence. Resetting or closing it discards all synthetic data.
        </p>
      </details>
      <div className='explorer-controls'>
        <label>
          Demo scenario
          <select value={scenario} onChange={e => setScenario(e.target.value)}>
            <option value='ready'>Ready · REST v2 source example</option>
            <option value='expired'>Expired credential</option>
            <option value='wrong-instance'>Wrong instance</option>
            <option value='unsupported-version'>Unsupported API version</option>
            <option value='unavailable'>Upcoming capability</option>
          </select>
        </label>
        <label>
          Demo identity
          <select value={identity} onChange={e => setIdentity(e.target.value)}>
            <option value='organizer'>
              Organizer · demo-person-1 · read/create
            </option>
            <option value='attendee'>
              Attendee · demo-person-2 · read only
            </option>
          </select>
        </label>
        <label>
          Event title
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <p>
          Retained request: <code>demo-request-1</code>. Real protected writes
          require a retained Unix-millisecond.UUID identifier.
        </p>
        <label>
          <input
            type='checkbox'
            checked={lost}
            onChange={e => setLost(e.target.checked)}
          />
          Simulate a lost create response
        </label>
        <div className='document-actions'>
          <button
            type='button'
            onClick={() => {
              if (!prerequisiteFailed())
                setResponse(
                  `200 OK\n${JSON.stringify({ items: event ? [event] : [], nextCursor: null }, null, 2)}`
                );
            }}
          >
            List events
          </button>
          <button type='button' onClick={() => create(false)}>
            Create event
          </button>
          <button
            type='button'
            onClick={() => create(true)}
            disabled={!retained}
          >
            Replay retained create
          </button>
          <button
            type='button'
            onClick={() => {
              setState({
                response:
                  'Demo reset. No real credential needs revocation and no real event was created.',
              });
              setTitle('Developer dinner');
              setIdentity('organizer');
              setScenario('ready');
              setLost(false);
            }}
          >
            Reset demo
          </button>
        </div>
      </div>
      <pre role='status' aria-label='Demo response' aria-live='polite'>
        {response}
      </pre>
      <h2>Ready for a real integration?</h2>
      <p>
        Verify your intended instance, account and API release, then follow the{' '}
        <a href='/v2/integrator'>read-and-create guide</a>. Replay guarantees
        are operation-specific.
      </p>
    </article>
  );
}
