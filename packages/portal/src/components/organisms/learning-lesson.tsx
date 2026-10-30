'use client';
import { useState } from 'react';
import {
  createExamples,
  learningDefaults,
  localExamples,
} from '../../learning-examples';
import {
  simulateCreate,
  type SimulationState,
} from '../../learning-simulation';
import { CodeExample } from '../molecules/code-example';

const languages = {
  typescript: 'TypeScript',
  python: 'Python',
  curl: 'cURL',
} as const;
type Language = keyof typeof languages;

export function FirstEventLesson() {
  const [local, setLocal] = useState(false);
  const [lost, setLost] = useState(false);
  const [scenario, setScenario] = useState('ready');
  const [title, setTitle] = useState<string>(learningDefaults.title);
  const [language, setLanguage] = useState<Language>('typescript');
  const [state, setState] = useState<SimulationState>({
    response:
      'Simulation ready. Run to create and read back one fixture Event.',
  });
  const preview = state.event ?? {
    eventId: learningDefaults.eventId,
    title: learningDefaults.title,
  };
  function runCreate(replay: boolean) {
    setState(current =>
      simulateCreate(current, {
        title,
        identity: 'organizer',
        scenario,
        lost,
        replay,
        eventId: learningDefaults.eventId,
      })
    );
  }
  return (
    <section className='learning-lesson' aria-label='First Event simulation'>
      <p className='eyebrow'>Simulation · no account or credentials</p>
      <h2>Your finished Event</h2>
      <article className='event-preview' aria-label='Simulated Event preview'>
        <p>Simulated · private local preview</p>
        <h3>{preview.title}</h3>
        <p>Undated · You are the Organizer · No invitations sent</p>
        <code>{preview.eventId}</code>
      </article>
      <p>
        This finished fixture is the goal. Run edits only in memory; it never
        contacts Groupi. Source support is not verified deployment or security
        evidence.
      </p>
      <label>
        Event title
        <input
          maxLength={200}
          value={title}
          onChange={event => setTitle(event.target.value)}
        />
      </label>
      <div
        role='tablist'
        aria-label='Example language'
        className='document-actions'
      >
        {(Object.keys(languages) as Language[]).map((key, index, keys) => (
          <button
            key={key}
            role='tab'
            id={`example-${key}`}
            aria-controls='learning-example'
            aria-selected={language === key}
            tabIndex={language === key ? 0 : -1}
            onClick={() => setLanguage(key)}
            onKeyDown={event => {
              const next =
                event.key === 'ArrowRight'
                  ? keys[(index + 1) % keys.length]
                  : event.key === 'ArrowLeft'
                    ? keys[(index + keys.length - 1) % keys.length]
                    : event.key === 'Home'
                      ? keys[0]
                      : event.key === 'End'
                        ? keys[keys.length - 1]
                        : undefined;
              if (next) {
                event.preventDefault();
                setLanguage(next);
                document.getElementById(`example-${next}`)?.focus();
              }
            }}
          >
            {languages[key]}
          </button>
        ))}
      </div>
      <div
        role='tabpanel'
        id='learning-example'
        aria-labelledby={`example-${language}`}
        tabIndex={0}
      >
        <CodeExample
          title={`${languages[language]} create request`}
          code={
            createExamples({ title, requestId: learningDefaults.requestId })[
              language
            ]
          }
        />
      </div>
      <p>
        Retained fixture request: <code>{learningDefaults.requestId}</code>. The
        same payload and identity are retained until Reset. Real create replay
        has a 24-hour window.
      </p>
      <label className='lesson-checkbox'>
        <input
          type='checkbox'
          checked={lost}
          onChange={event => setLost(event.target.checked)}
        />
        Simulate a lost create response
      </label>
      <details>
        <summary>Optional recovery exercises</summary>
        <label>
          Recovery exercise
          <select
            value={scenario}
            onChange={event => setScenario(event.target.value)}
          >
            <option value='ready'>Ready</option>
            <option value='expired'>Expired credential</option>
            <option value='wrong-instance'>Wrong instance</option>
            <option value='denied'>Insufficient create authority</option>
            <option value='expired-request'>Expired request identity</option>
          </select>
        </label>
      </details>
      <div className='document-actions'>
        <button type='button' onClick={() => runCreate(false)}>
          Run simulation
        </button>
        <button
          type='button'
          disabled={!state.retained}
          onClick={() => runCreate(true)}
        >
          Replay retained create
        </button>
        <button
          type='button'
          onClick={() => {
            setTitle(learningDefaults.title);
            setLanguage('typescript');
            setLost(false);
            setScenario('ready');
            setState({
              response:
                'Simulation reset. No real Event was created or deleted.',
            });
          }}
        >
          Reset simulation
        </button>
      </div>
      <p>Simulated Events created: {state.event ? 1 : 0}</p>
      <pre role='status' aria-label='Simulation response' aria-live='polite'>
        {state.response}
      </pre>
      <button
        type='button'
        aria-expanded={local}
        aria-controls='local-run'
        onClick={() => setLocal(current => !current)}
      >
        Run against my account
      </button>
      {local ? (
        <section id='local-run' aria-label='Run locally, not in this browser'>
          <h3>Run locally, not in this browser</h3>
          <p>
            Keep your real API key outside this portal. This button only reveals
            instructions; Run simulation remains synthetic. Use environment
            variables or your local secret manager, never a browser field, URL
            or agent prompt.
          </p>
          <ol>
            <li>
              Verify the intended API instance supports REST v2 and separately
              confirm its matching website origin. Use an own-account legacy
              collection key with read/create permissions, not a bounded key or
              delegated token.
            </li>
            <li>
              Set GROUPI_API_URL, GROUPI_WEB_URL and GROUPI_EXPECTED_PERSON_ID
              locally. Independently verify the matching origins before setting
              GROUPI_CONFIRMED_API_URL and GROUPI_CONFIRMED_WEB_URL. Supply
              GROUPI_API_KEY privately.
            </li>
            <li>
              Run the copied example with GROUPI_ALLOW_CREATE unset to check
              your account and list accessible Events. An empty list is success.
              Wrong account, instance or capability must stop; never substitute
              a more powerful key.
            </li>
            <li>
              Only after reviewing the intended write, set
              GROUPI_ALLOW_CREATE=yes and optionally GROUPI_EVENT_TITLE. Retain
              groupi-first-event.json unchanged for recovery. Do not regenerate
              its request identity after an uncertain response.
            </li>
            <li>
              Inspect the permitted read-back and use the printed Open in Groupi
              URL on the verified matching website. Keep or deliberately remove
              the test Event in Groupi and revoke a temporary key when finished.
              Reset simulation never deletes a real Event.
            </li>
          </ol>
          <p>
            Prerequisites: TypeScript uses Node.js 22.18+ native type stripping;
            Python uses Python 3.10+; cURL uses Bash, cURL 7.76+ and Python
            3.10+ for safe JSON and retained state. No unpublished SDK
            installation is required. These are local examples, not deployment
            verification.
          </p>
          <CodeExample
            title={`Local ${languages[language]} workflow`}
            code={localExamples[language]}
          />
          <a href='/v2/integrator#credentials'>
            Review instance and credential prerequisites
          </a>
        </section>
      ) : null}
    </section>
  );
}
