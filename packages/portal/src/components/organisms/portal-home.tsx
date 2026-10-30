'use client';
export function PortalHome() {
  return (
    <section className='landing'>
      <p className='eyebrow'>Make something that brings people together</p>
      <h1 tabIndex={-1}>
        Build with Groupi.
        <br />
        Help shape what comes next.
      </h1>
      <p>
        Integrate your tools, automate event planning, or contribute to the
        open-source app.
      </p>
      <div className='journeys'>
        <a href='/v2/integrator' aria-label='Build with Groupi'>
          Build with Groupi{' '}
          <small>
            Read your first events, create safely and explore the API.
          </small>
        </a>
        <a href='/v2/contributor' aria-label='Contribute to Groupi'>
          Contribute to Groupi{' '}
          <small>
            Set up a focused test, understand the architecture and submit a
            change.
          </small>
        </a>
      </div>
      <div className='route-cards'>
        <a href='/cli/0.1.0/guide'>
          Automate with the CLI
          <span>Profiles, structured output and replay recovery</span>
        </a>
        <a href='/v2/addons'>
          Author an add-on<span>Source handlers and reusable templates</span>
        </a>
        <a href='/v2/self-hosting'>
          Own-instance roadmap
          <span>Proposed · no supported install quickstart</span>
        </a>
        <a href='/v2/concepts'>
          Learn the concepts
          <span>Roles, Groups, invite lists and event audiences</span>
        </a>
        <a href='/v2/architecture'>
          Understand the architecture
          <span>Domain operations and shared/platform ownership</span>
        </a>
        <a href='/v2/exports'>
          Retrieve docs for your agent
          <span>Markdown, text and public JSON exports</span>
        </a>
        <a href='/v2/sdks'>
          SDK availability
          <span>TypeScript and Python · upcoming source candidates</span>
        </a>
        <a href='/v2/auth'>
          Authorization availability
          <span>Bounded credentials and delegated sign-in</span>
        </a>
        <a href='/v2/versions'>
          Versions and status
          <span>Current, upcoming and proposed capabilities</span>
        </a>
      </div>
    </section>
  );
}
